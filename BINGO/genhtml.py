def read_bingo_file(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        lines = file.read().strip().split('\n\n')  # Splitting by double newlines
    
    bingo_list = []
    for entry in lines:
        parts = entry.split('\n', 1)  # Split into tile and rules
        if len(parts) == 2:
            bingo_list.append((parts[0].strip(), parts[1].strip()))
        else:
            print(f"Skipping invalid entry: {entry}")
    
    return bingo_list

if __name__ == "__main__":
    bingo_data = read_bingo_file("BINGO.txt")
    print(bingo_data)
    for idx, (tile, rule) in enumerate(bingo_data, start=1):
        tile = tile.replace("*", "<br>")
        rule = rule.replace("*", "<br>")
        print(f'<div id="cell-{idx}" class="grid-cell incomplete-cell" rules="{rule}">{tile}</div>')
    