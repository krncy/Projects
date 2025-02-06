function generateDeck(numDecks) {
  const suits = ['heart', 'diamond', 'club', 'spade'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const deck = [];

  for (let i = 0; i < numDecks; i++) {
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({ suit, rank });
      });
    });
  }

  return deck;
}

function dealCards(users, deck, numberOfCards) {
  // Iterate over each user in the users map
  for (const user of users.values()) {
    // Deal faceDownCards
    user.faceDownCards = deck.splice(0, numberOfCards);
	user.faceUpCards = []

    // Deal cardsInHand (twice the number of faceDownCards)
    user.cardsInHand = deck.splice(0, 2 * numberOfCards);
  }
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap deck[i] and deck[j]
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}


// Store user information and cards
var host = null;
var numDecks = 2
var numCards = 3

var deck = generateDeck(numDecks);

var centerCards = []

const users = new Map();
// id: {id:"", username:"", faceUpCards:[], faceDownCards:[], cardsInHand: []}

var gameInProgress = false;
var numPlayerSelectedCards = 0;
var turn = null;


function sendReDraw() {
	io.emit('updatePlayers', {users: JSON.stringify([...users]), deck: deck.length, centerCards: centerCards});
}

function sit(socket, username) {
	
	if (!gameInProgress){
		socket.username = username;
		users.set(socket.id, {id: socket.id, username, faceUpCards: [], faceDownCards: [], cardsInHand: []});

		console.log(`User ${username} with ID ${socket.id} connected`);

		// if a host does not exist, set the first user to host
		if (host == null) {
			host = socket.id;
			console.log(`User ${username} with ID ${socket.id} is set as host`);
			socket.emit('host', true);
		}

		io.emit('userConnected', username);
		
		socket.emit("joined", socket.id)
		sendReDraw()
	}
	else {
		socket.emit("failedToJoin")
	}
}

function disconnect(socket) {
	const user = users.get(socket.id);
		if (user) {
			io.emit('userDisconnected', user);
			
			users.delete(socket.id);
			console.log(`User ${user.username} with ID ${socket.id} disconnected`);
			sendReDraw()
		  
			// Check if the disconnected user was the host
			if (socket.id === host) {
				// Update the host to the next connected user
				host = users.size > 0 ? users.entries().next().value[0] : null;

				// Notify the new host (if there is one)
				if (host) {
					io.to(host).emit('host', true);
					console.log(`User ${users.get(host).username} with ID ${host} is set as host`);
				} else {
					gameInProgress = false
				}
			}
		} else {
		  console.log(`User with ID ${socket.id} disconnected`);
		}
}

function startGame(socket, data) {
	 // Check if the sender is the host
		if (socket.id === host) {
		  
			gameInProgress = true;
			numDecks = data.numDecks
			numCards = data.numCards
			centerCards = [];
			numPlayerSelectedCards = 0;
			
			// Generate and deal cards to all users
			deck = generateDeck(data.numDecks);
			shuffleDeck(deck)
			dealCards(users, deck, data.numCards)
			
			io.emit('gameDetails', data)
			sendReDraw()
			
			console.log(`Game started, ${data.numDecks} decks, ${data.numCards} cards`);
						
			io.emit('selectCards', {users: JSON.stringify([...users]), deck: deck.length, centerCards: centerCards});
		}
}

function selectCards(socket, data) {
	user = users.get(socket.id)
	data.sort(function(a,b) {return b-a;});
	
	if (data[0] < 0) return false;
	if (data[data.length - 1] > user.cardsInHand.length - 1) return false;
	
	for (i in data) {
		user.faceUpCards[i] = user.cardsInHand[data[i]]
	}
	for (i in data) {
		user.cardsInHand.splice(data[i],1);
	}	
	sendReDraw()
	
	numPlayerSelectedCards += 1;

	if (numPlayerSelectedCards == users.size) {
		let keysArray = Array.from(users.keys());
		let randomKey = keysArray[Math.floor(Math.random() * keysArray.length)];
		turn = randomKey
	}
}

function playCard(socket, data) {
	if (socket.id == turn) {
		console.log(data)
	}
}

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
    
	socket.on('disconnect', () => {
		disconnect(socket);
	});
	
	socket.on('sit', (username) => {
		sit(socket, username);
	});

	socket.on('stand', () => {
		disconnect(socket);
	});
	
	socket.on('startGame', (data) => {
		startGame(socket, data)
	});
	
	socket.on('selectCards', (data) => {
		selectCards(socket, data) ;	
	});
	
	socket.on('playCard', (data) => {
		playCard(socket, data);
	});
	
	socket.on('requestPlayerCards', (data) => {
		socket.emit('playerC', )
	});
	
	socket
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
});
