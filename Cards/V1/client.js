const socket = io('http://localhost:3000');
var id = null
var host = false;
var playerCount = 0;
var numCards = 3;

function setup() {
	
	var w = window.innerWidth;
	var h = window.innerHeight;
	
	log = document.getElementById("log")
	hand = document.getElementById("hand")
	table = document.getElementById("poker-table-container")
	
	const logWidth = 200
	const handHeight = 120
	
	log.style.left = "0px";
	log.style.top = "0px";
	log.style.width = logWidth + "px";
	log.style.height = h + "px";
	
	hand.style.bottom = "0px";
	hand.style.left = logWidth + "px";
	hand.style.height = handHeight + "px";
	hand.style.width = w - logWidth + "px";
	
	var tableRadius = Math.min(w - logWidth, h - handHeight)/2
	
	table.style.left = logWidth + "px";
	table.style.top = 0 + "px";
	
	table.style.width = w - logWidth + "px";
	table.style.height = h - handHeight + "px";
	
	
	
	
	
}

function addToLog(message) {
	log = document.getElementById("log")
	
	const isScrolledToBottom = log.scrollHeight - log.clientHeight <= log.scrollTop + 1
	log.innerHTML += message
	
	if (isScrolledToBottom) {
      log.scrollTop = log.scrollHeight - log.clientHeight
    }
}

function createPlayingCard(card) {
	
	if (!card) {
		cardElement = document.createElement("div");
		cardElement.classList.add("card")
		
		return cardElement
	}
	
	const suitSymbol = {
		'heart': '♥',
		'diamond': '♦',
		'club': '♣',
		'spade': '♠',
	};
	
	cardElement = document.createElement("div");
	cardElement.classList.add("card")
	
	cardTopSym = document.createElement("div")
	cardTopSym.style.position = "absolute";
	cardTopSym.style.top = "10px";
	cardTopSym.style.left = "10px";
	cardTopSym.innerText = card.rank
	
	cardRank = document.createElement("div")
	cardRank.classList.add(card.suit);
	cardRank.style.position = "absolute";
	cardRank.style.top = "50%";
	cardRank.style.left = "50%";
	cardRank.style.transform = "translate(-50%, -50%)";
	cardRank.style.fontSize = "36px";
	cardRank.innerText = suitSymbol[card.suit]
	
	cardBotSym = document.createElement("div")
	cardBotSym.style.position = "absolute";
	cardBotSym.style.bottom = "10px";
	cardBotSym.style.right = "10px";
	cardBotSym.innerText = card.rank
	
	cardElement.append(cardTopSym)
	cardElement.append(cardRank)
	cardElement.append(cardBotSym)
	
  return cardElement;
}

function createSitButton() {
	const sitButton = document.createElement('button');
	sitButton.style.width = "50px"
	sitButton.style.height = "50px"
	sitButton.id = "sitButton"

	sitButton.innerText = 'Sit';
	sitButton.addEventListener('click', () => {
		const username = prompt('Enter your name:');
		socket.emit('sit', username);
	});
	return sitButton
}

function createStandButton() {
	const standButton = document.createElement('button');
	standButton.style.width = "50px"
	standButton.style.height = "50px"
	standButton.id = "standButton"

	standButton.innerText = 'Stand';
	standButton.addEventListener('click', () => {
		if (confirm("are you sure you want to leave?")) {
			socket.emit('stand');
			document.getElementById('standButton').remove();
			document.getElementById('sit_start').append(createSitButton());
			
			if (host) {
				document.getElementById('startDiv').remove();
				host = false
			}
		}
	});
	return standButton
}

function createHostButton(host) {
	if (host) {
		addToLog(`<i>You are now the host </i></br>`);
		// If the user is the host, create input and button elements
		// Input field for the number of decks
		const numDecksInput = document.createElement('input');
		numDecksInput.setAttribute('type', 'number');
		numDecksInput.setAttribute('placeholder', 'Enter number of decks (default is 2)');
		numDecksInput.setAttribute('min', '1');
		numDecksInput.setAttribute('value', '2'); // default value is 2, change as needed
		numDecksInput.style.width = '50px'; // Set the width to a reasonable size

		// Input field for the number of cards
		const numCardsInput = document.createElement('input');
		numCardsInput.setAttribute('type', 'number');
		numCardsInput.setAttribute('placeholder', 'Enter number of cards (default is 3)');
		numCardsInput.setAttribute('min', '1');
		numCardsInput.setAttribute('value', '3'); // default value is 3, change as needed
		numCardsInput.style.width = '50px'; // Set the width to a reasonable size

		// Button to start the game
		const startGameButton = document.createElement('button');
		startGameButton.innerText = 'Start Game';
		startGameButton.addEventListener('click', () => {
		  const numDecks = numDecksInput.value || 2; // Use the entered value or default to 2
		  const numCards = numCardsInput.value || 52; // Use the entered value or default to 52

		  if (numCards * 3 * playerCount <= numDecks * 52) {
			if (confirm("Are you sure you want to start a new game?")) {
				socket.emit('startGame', {numDecks, numCards});
			}
		  } else {
			alert(`There are not enough cards in ${numDecks} decks for ${playerCount}`)
		  }
		});

		// Create a container for start, text, and input box and preprend it to the main div
		const startDiv = document.createElement('div')
		startDiv.id = "startDiv"

		startDiv.append(startGameButton);
		startDiv.append(document.createElement('br')); // Add a line break
		startDiv.append("Number of Decks: ");
		startDiv.append(numDecksInput);
		startDiv.append(document.createElement('br')); // Add a line break
		startDiv.append("Number of Cards: ");
		startDiv.append(numCardsInput);

		document.getElementById('sit_start').append(startDiv);
	}
}

function drawTable(users, deck, centerCards) {
	const userArray = [...users.values()];
	
	// create table 
	const pokerTableContainer = document.getElementById('poker-table-container');
	pokerTableContainer.innerHTML = "";
	
	const pokerTable = document.createElement("div");
	pokerTable.id = "poker-table"
	
	pokerTableContainer.append(pokerTable)
	
	// Calculate the optimal table size based on the number of players
	const tableDiameter = Math.min(pokerTableContainer.offsetWidth, pokerTableContainer.offsetHeight) - 50;


	const tableRadius = tableDiameter / 2;
	
	pokerTable.style.width = tableDiameter + "px";
	pokerTable.style.height = tableDiameter + "px";
	
	// create seats
	if (userArray.length == 0) return;
	
	const cardHeight = 100;
	const cardWidth = cardHeight * 63 / 88;
	
	const seatHeight = cardHeight + 2 * 17 + 4 * 17;
	const seatWidth = cardWidth * numCards + (numCards) * 14;
	
	const offSetIndex = userArray.findIndex(obj => obj.id == id);

	for (let i = 1; i <= users.size; i++) {
		const angle = (360 / users.size) * (-offSetIndex + i - 1);

		const seat = document.createElement('div');
		seat.classList.add('seat');

		const top = tableRadius + Math.sin(Math.PI / 2 + (angle * Math.PI) / 180) * (tableRadius - seatHeight / 2);
		const left = tableRadius + Math.cos(Math.PI / 2 + (angle * Math.PI) / 180) * (tableRadius - seatWidth / 2);
		
		seat.style.top = `${top - seatHeight / 2}px`;
		seat.style.left = `${left - seatWidth / 2}px`;
		seat.style.width = seatWidth + "px"
		seat.style.height = seatHeight + "px"
		
		const playerName = document.createTextNode(`${userArray[i-1]["username"]}`);
		seat.appendChild(playerName);

		const cardsContainer = document.createElement('div');
		cardsContainer.classList.add('cards-container');
		
		for (let j = 0; j < userArray[i-1]["faceUpCards"].length; j++) {
			card = createPlayingCard(userArray[i-1]["faceUpCards"][j]);
			card.classList.add("card-face-up");
			card.style.width = cardWidth + "px";
			card.style.height = cardHeight + "px";
			cardsContainer.append(card);
		}
		
		for (let j = userArray[i-1]["faceUpCards"].length; j < userArray[i-1]["faceDownCards"].length; j++) {
			card = createPlayingCard();
			card.classList.add("card-face-down");
			card.style.width = cardWidth + "px";
			card.style.height = cardHeight + "px";
			cardsContainer.append(card);
		}
		
		if (cardsContainer.childNodes.length != 0) {
			seat.appendChild(cardsContainer);
		}
		
		if (userArray[i-1]["cardsInHand"].length != 0) {
			const cardCount = document.createTextNode(userArray[i-1]["cardsInHand"].length);
			seat.appendChild(cardCount);
		}
		
		pokerTable.appendChild(seat);
	}
	
	// create deck and center card
	const middleCardsContainer = document.createElement("div")
	middleCardsContainer.id = "middle-cards-container"
	
	const deckElement = document.createElement("div");
	deckElement.classList.add("card")
	
	numberOfCardsLeftElement = document.createElement("div")
	numberOfCardsLeftElement.style.position = "absolute";
	numberOfCardsLeftElement.style.top = "50%";
	numberOfCardsLeftElement.style.left = "50%";
	numberOfCardsLeftElement.style.transform = "translate(-50%, -50%)";
	numberOfCardsLeftElement.style.fontSize = "36px";
	numberOfCardsLeftElement.innerText = deck
	
	deckElement.classList.add("card-face-down");
	deckElement.style.width = cardWidth + "px";
	deckElement.style.height = cardHeight + "px";
	
	deckElement.append(numberOfCardsLeftElement)
	
	var centerCardElement;
	if (centerCards == [] || centerCards == undefined) {
		centerCardElement = createPlayingCard()
	} else {
		centerCardElement = createPlayingCard(centerCards[0])
	}
	
	centerCardElement.classList.add("card-face-up");
	centerCardElement.style.width = cardWidth + "px";
	centerCardElement.style.height = cardHeight + "px";
	
	middleCardsContainer.append(deckElement)
	middleCardsContainer.append(centerCardElement)
	
	pokerTable.append(middleCardsContainer)
	
	
}

function displayAndSelectCards(cards, numCards) {
	var overlay = document.getElementById('overlay-select-card')
	overlay.style.display = 'flex';
	var cardContainer = document.createElement('div')
	cardContainer.id = "select-card-container"
		
	overlay.appendChild(cardContainer)
	const selectedCards = [];

	function createCardElements() {
	
		cardContainer.innerHTML = '';
		cards.forEach(card => {
			
			const cardElement = createPlayingCard(card)
			
			cardElement.style.width = "100px";
			cardElement.style.height = 100 * 88 / 63 + "px"
			cardElement.classList.add("card-select-initial")
			cardElement.setAttribute('card-number', cards.indexOf(card));
			cardElement.addEventListener('click', () => toggleCardSelection(cardElement));
			
			cardContainer.appendChild(cardElement);
		});
	}

	function createConfirmButton() {
		confirmBtn = document.getElementById('confirm-btn');
					
		if (!confirmBtn) {
			confirmBtn = document.createElement('button');
			confirmBtn.id = 'confirm-btn';
			confirmBtn.textContent = 'Confirm Selection';
			confirmBtn.disabled = true;

			confirmBtn.addEventListener('click', () => {
				
				// Add your logic here to handle the confirmed selection
				overlay.innerHTML = "";
				overlay.style.display = 'none';
				socket.emit("selectCards", selectedCards)
				
			});

		document.getElementById("overlay-select-card").append(confirmBtn);
		}
	}

	function updateConfirmButton() {
		if (confirmBtn) {
			const isDisabled = selectedCards.length != numCards;
			confirmBtn.disabled = isDisabled;
		} else {
			createConfirmButton();
		}
	}
	
	function toggleCardSelection(card) {
		card.classList.toggle('selected'); // Toggle the 'selected' class

		if (card.classList.contains('selected')) {
			selectedCards.push(card.getAttribute('card-number'));
		} else {
			selectedCards.splice(selectedCards.indexOf(card.getAttribute('card-number')), 1);
		}

		updateConfirmButton();
	}

	createCardElements();
	createConfirmButton();
}		


function displayPlayableCards(cards) {
	console.log("draw")
	hand = document.getElementById("hand");
	hand.innerHTML = ""
	
	const cardHeight = 100;
	const cardWidth = cardHeight * 63 / 88;
	
	
	
	for (let i = 0; i < cards.length; i++) {
		card = createPlayingCard(cards[i]);
		card.classList.add("card-face-up");
		card.style.width = cardWidth + "px";
		card.style.height = cardHeight + "px";
		hand.append(card);
	}
	
}


socket.on('userConnected', (data) => {
	addToLog(`<i>${data} connected </i></br>`);
});

socket.on('userDisconnected', (data) => {
	addToLog(`<i>${data.username} disconnected </i></br>`);
});

socket.on('disconnect', () => {
	addToLog('<i>Disconnected from the server</i></br>');
});

socket.on('host', (data) => {
	createHostButton(data)
});

socket.on('joined', (data) => {
	id = data
	document.getElementById("sitButton").remove();
	document.getElementById('sit_start').append(createStandButton());
});

socket.on('failedToJoin', () => {
	addToLog("Could not sit, game in progress</br>")
});

socket.on('updatePlayers', (data) => {
	if (data != "[]") {
		users = new Map(JSON.parse(data.users))	
		deck = data.deck
		centerCards = data.centerCards
		playerCount = users.size
		drawTable(users, deck, centerCards)
		
		if (users.has(id)) {
			displayPlayableCards(users.get(id)["cardsInHand"])
		}
	} else {
		drawTable(new Map(), [], [])
	}
});

socket.on('closeOverlay', (data) => {
	
	var overlay = document.getElementById('overlay-select-card')
	overlay.innerHTML = "";
	overlay.style.display = 'none';
});

socket.on('gameDetails', (data) => {
	addToLog('</br><i>Game started...</i></br>');
	addToLog(`<i>${data.numDecks} decks have been used</i></br>`);
	addToLog(`<i>${data.numCards} cards have been dealt</i></br>`);
    addToLog('</br><i>Waiting for players to select cards</i></br>');
	numCards = data.numCards
});

socket.on('selectCards', (data) => {
	console.log(data)
	if (data != "[]") {
		users = new Map(JSON.parse(data.users))
		deck = data.deck
		centerCards = data.centerCards
		playerCount = users.size
		drawTable(users, deck, centerCards)
		
		displayAndSelectCards(users.get(id)["cardsInHand"], numCards)
		displayPlayableCards(users.get(id)["cardsInHand"])
	} else {
		drawTable(new Map(), [], [])
	}

	
});

window.addEventListener('resize', function(event) {
	setup()
	
});

addToLog("<i>Welcome to shitthead</i></br>")
document.getElementById('sit_start').append(createSitButton());
setup()