const OPENINGS: [string, RegExp, string][] = [
  ["A00", /^1\.\s*a3|1\.\s*b4|1\.\s*c3|1\.\s*d3|1\.\s*e3|1\.\s*f3|1\.\s*g3|1\.\s*h3|1\.\s*a4|1\.\s*b3|1\.\s*c4|1\.\s*d4|1\.\s*e4|1\.\s*f4|1\.\s*g4|1\.\s*h4/, "Uncommon Opening"],
  ["A00", /^1\.Na3|1\.Nc3|1\.Nf3|1\.Nh3/, "Reti Opening"],
  
  ["A01", /^1\.\s*b4\s*e5/, "Nimzo-Larsen Attack"],
  
  ["A10", /^1\.\s*c6/, "English Defense"],
  ["A13", /^1\.c4\s*e6/, "English Opening"],
  
  ["B00", /^1\.e4\s+(?!e5|c5|d5|d6|f5|e6|c6|Nc6|Nf6)[a-h]/, "King's Pawn Game"],
  ["B00", /^1\.e4\s+a5/, "Nimzowitsch Defense"],
  
  ["B01", /^1\.e4\s+d5/, "Scandinavian Defense"],
  ["B02", /^1\.e4\s+d6/, "Pirc Defense"],
  ["B06", /^1\.e4\s+g6/, "Modern Defense"],
  ["B07", /^1\.e4\s+d6\s+\d\.d4/, "Pirc Defense"],
  ["B08", /^1\.e4\s+d6\s+\d\.d4\s+Nf6/, "Pirc Defense"],
  ["B09", /^1\.e4\s+d6\s+\d\.d4\s+Nf6\s+\d\.Bg5/, "Classical Pirc"],
  
  ["B10", /^1\.e4\s+c6/, "Caro-Kann Defense"],
  ["B11", /^1\.e4\s+c6\s+\d\.c4/, "Caro-Kann Defense"],
  ["B12", /^1\.e4\s+c6\s+\d\.d4/, "Caro-Kann Defense"],
  ["B13", /^1\.e4\s+c6\s+\d\.d4\s+d5/, "Caro-Kann Defense"],
  ["B14", /^1\.e4\s+c6\s+\d\.d4\s+d5\s+\d\.Nc3/, "Caro-Kann Defense"],
  
  ["B15", /^1\.e4\s+c6\s+\d\.Nc3/, "Caro-Kann Defense"],
  ["B17", /^1\.e4\s+c6\s+\d\.d4\s+d5\s+\d\.Nd2/, "Steinitz Variation"],
  ["B18", /^1\.e4\s+c6\s+\d\.d4\s+d5\s+\d\.Nd2\s+Bf5/, "Classical Variation"],
  ["B19", /^1\.e4\s+c6\s+\d\.d4\s+d5\s+\d\.Nd2\s+Nf6/, "Classical Variation"],
  
  ["B20", /^1\.e4\s+c5/, "Sicilian Defense"],
  ["B21", /^1\.e4\s+c5\s+\d\.f4/, "Smith-Morra Gambit"],
  ["B22", /^1\.e4\s+c5\s+\d\.c3/, "Sicilian Defense"],
  ["B23", /^1\.e4\s+c5\s+\d\.Nc3/, "Sicilian Defense"],
  ["B24", /^1\.e4\s+c5\s+\d\.Nc3/, "Closed Sicilian"],
  ["B25", /^1\.e4\s+c5\s+\d\.Nc3\s+Nc6\s+\d\.g3/, "Closed Sicilian"],
  ["B26", /^1\.e4\s+c5\s+\d\.Nc3\s+Nc6\s+\d\.g3\s+d6/, "Closed Sicilian"],
  ["B27", /^1\.e4\s+c5\s+\d\.Nf3/, "Sicilian Defense"],
  ["B28", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6/, "Sicilian Defense"],
  ["B29", /^1\.e4\s+c5\s+\d\.Nf3\s+Nf6/, "Sicilian Defense"],
  ["B30", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6/, "Sicilian Defense"],
  ["B31", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5/, "Sicilian Defense"],
  ["B32", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4/, "Sicilian Defense"],
  ["B33", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4\s+cd/, "Sicilian Sveshnikov"],
  ["B34", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4\s+cd\s+\d\.Nc3/, "Sicilian Defense"],
  ["B35", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4\s+cd\s+\d\.Nc3\s+Nf6/, "Sicilian Defense"],
  ["B36", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4\s+cd\s+\d\.Nc3\s+Nf6\s+\d\.Bg5/, "Sicilian Najdorf"],
  ["B37", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4\s+cd\s+\d\.Nc3\s+Nf6\s+\d\.Bg5\s+e6/, "Sicilian Najdorf"],
  ["B38", /^1\.e4\s+c5\s+\d\.Nf3\s+Nc6\s+\d\.d4\s+cd\s+\d\.Nc3\s+Nf6\s+\d\.Bg5\s+e6\s+\d\.Qd2/, "Sicilian Defense"],
  ["B40", /^1\.e4\s+c5\s+\d\.Nf3\s+e6/, "Sicilian Defense"],
  ["B41", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd/, "Sicilian Defense"],
  ["B42", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+e6/, "Kan Variation"],
  ["B43", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4/, "Sicilian Defense"],
  ["B44", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6/, "Taimanov Variation"],
  ["B45", /^1\.e4\s+c5\s+\d\.Nf3\s+e6\s+\d\.d4\s+cd/, "Sicilian Defense"],
  ["B46", /^1\.e4\s+c5\s+\d\.Nf3\s+e6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nc6/, "Taimanov Variation"],
  ["B47", /^1\.e4\s+c5\s+\d\.Nf3\s+e6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nc6\s+\d\.Nc3/, "Sicilian Defense"],
  ["B48", /^1\.e4\s+c5\s+\d\.Nf3\s+e6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nc6\s+\d\.Nc3\s+Qc7/, "Sicilian Defense"],
  ["B50", /^1\.e4\s+c5\s+\d\.Nf3\s+d6/, "Sicilian Defense"],
  ["B51", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.Bc4/, "Canal-Sokolsky Attack"],
  ["B52", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.Bb3/, "Sicilian Defense"],
  ["B53", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4/, "Sicilian Defense"],
  ["B54", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd/, "Sicilian Defense"],
  ["B55", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Bg5/, "Sicilian Defense"],
  ["B56", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nc3/, "Sicilian Defense"],
  ["B57", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nc3\s+Nc6/, "Sicilian Defense"],
  ["B60", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+Nc6/, "Sicilian Richter-Rauzer"],
  ["B65", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+Nc6\s+\d\.Be3\s+Bf5/, "Sicilian Defense"],
  ["B66", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+Nc6\s+\d\.Bg5/, "Sicilian Richter-Rauzer"],
  ["B67", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+Nc6\s+\d\.Bg5\s+e6/, "Sicilian Defense"],
  ["B68", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+Nc6\s+\d\.Bg5\s+e6\s+\d\.Qd2/, "Sicilian Defense"],
  ["B70", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6/, "Dragon Variation"],
  ["B72", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Be3/, "Dragon Variation"],
  ["B73", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Be3\s+Nc6/, "Dragon Variation"],
  ["B74", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Be3\s+Nc6\s+\d\.Bb3/, "Dragon Variation"],
  ["B75", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Bg5/, "Dragon Variation"],
  ["B76", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Be3\s+Bg7/, "Dragon Variation"],
  ["B77", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Be3\s+Bg7\s+\d\.Qd2\s+b5/, "Dragon Variation"],
  ["B78", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+g6\s+\d\.Be3\s+Bg7\s+\d\.Qd2\s+b5\s+\d\.O-O-O/, "Yugoslav Attack"],
  ["B80", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6/, "Sicilian Defense"],
  ["B81", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Be3/, "Sicilian Scheveningen"],
  ["B83", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+Nc6/, "Sicilian Defense"],
  ["B84", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Be3\s+e5/, "Sicilian Defense"],
  ["B85", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Be3\s+e6/, "Sicilian Defense"],
  ["B86", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Bc4/, "Sicilian Defense"],
  ["B87", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Bc4\s+a6/, "Sicilian Defense"],
  ["B88", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Bc4\s+Nc6/, "Sicilian Defense"],
  ["B89", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Bc4\s+Nc6\s+\d\.Be3/, "Sicilian Defense"],
  ["B90", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6/, "Sicilian Najdorf"],
  ["B91", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.g3/, "Sicilian Najdorf"],
  ["B92", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Be2/, "Sicilian Najdorf"],
  ["B93", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.f3/, "Sicilian Najdorf"],
  ["B94", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Bg5/, "Sicilian Najdorf"],
  ["B95", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Bg5\s+e6/, "Sicilian Najdorf"],
  ["B96", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Bg5\s+e6\s+\d\.f4/, "Sicilian Najdorf"],
  ["B97", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Bg5\s+e6\s+\d\.Qe2/, "Sicilian Najdorf"],
  ["B98", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Bg5\s+e6\s+\d\.Qe2\s+Qe7/, "Sicilian Najdorf"],
  ["B99", /^1\.e4\s+c5\s+\d\.Nf3\s+d6\s+\d\.d4\s+cd\s+\d\.Nd4\s+Nf6\s+\d\.Nc3\s+a6\s+\d\.Bg5\s+e6\s+\d\.Qe2\s+Qe7\s+\d\.f4/, "Sicilian Najdorf"],
  
  ["C00", /^1\.e4\s+e6/, "French Defense"],
  ["C01", /^1\.e4\s+e6\s+\d\.d4\s+d5/, "French Exchange"],
  ["C02", /^1\.e4\s+e6\s+\d\.d4/, "French Defense"],
  ["C03", /^1\.e4\s+e6\s+\d\.e5/, "French Defense"],
  ["C04", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nd2/, "French Defense"],
  ["C05", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nd2\s+Nc6/, "French Defense"],
  ["C10", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3/, "French Defense"],
  ["C11", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3\s+Nf6/, "French Defense"],
  ["C12", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3\s+Nc6/, "French Defense"],
  ["C13", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nd2/, "French Defense"],
  ["C14", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nd2\s+Nf6\s+\d\.Bg5\s+Be7\s+\d\.e5/, "French Classical"],
  ["C15", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3/, "French Winawer"],
  ["C16", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3\s+Bb4/, "French Winawer"],
  ["C17", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3\s+Bb4\s+\d\.e5/, "French Winawer"],
  ["C18", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3\s+Bb4\s+\d\.e5\s+c5/, "French Winawer"],
  ["C19", /^1\.e4\s+e6\s+\d\.d4\s+d5\s+\d\.Nc3\s+Bb4\s+\d\.e5\s+c5\s+\d\.Nf3/, "French Winawer"],
  
  ["C20", /^1\.e4\s+e5/, "King's Pawn Game"],
  ["C21", /^1\.e4\s+e5\s+\d\.d4/, "Danish Gambit"],
  ["C22", /^1\.e4\s+e5\s+\d\.d4\s+ed/, "Center Game"],
  ["C23", /^1\.e4\s+e5\s+\d\.Bc4/, "Bishop's Opening"],
  ["C24", /^1\.e4\s+e5\s+\d\.Bc4\s+Nf6/, "Bishop's Opening"],
  ["C25", /^1\.e4\s+e5\s+\d\.Nc3/, "Vienna Game"],
  ["C26", /^1\.e4\s+e5\s+\d\.Nc3\s+Nf6/, "Vienna Game"],
  ["C30", /^1\.e4\s+e5\s+\d\.f4/, "King's Gambit"],
  ["C31", /^1\.e4\s+e5\s+\d\.f4\s+d5/, "King's Gambit Declined"],
  ["C33", /^1\.e4\s+e5\s+\d\.f4\s+ef/, "King's Gambit Accepted"],
  ["C34", /^1\.e4\s+e5\s+\d\.f4\s+ef\s+\d\.Nf3/, "King's Gambit Accepted"],
  ["C35", /^1\.e4\s+e5\s+\d\.f4\s+ef\s+\d\.Nf3\s+Be7/, "King's Gambit Accepted"],
  ["C36", /^1\.e4\s+e5\s+\d\.f4\s+ef\s+\d\.Nf3\s+Nc6/, "King's Gambit Accepted"],
  ["C37", /^1\.e4\s+e5\s+\d\.f4\s+ef\s+\d\.Nf3\s+Nc6\s+\d\.Bb5/, "King's Gambit Accepted"],
  ["C38", /^1\.e4\s+e5\s+\d\.f4\s+ef\s+\d\.Nf3\s+Nc6\s+\d\.Bc4/, "King's Gambit Accepted"],
  ["C39", /^1\.e4\s+e5\s+\d\.f4\s+ef\s+\d\.Nf3\s+Nc6\s+\d\.O-O/, "King's Gambit Accepted"],
  ["C40", /^1\.e4\s+e5\s+\d\.Nf3/, "King's Knight Opening"],
  ["C41", /^1\.e4\s+e5\s+\d\.Nf3\s+d6/, "Philidor Defense"],
  ["C42", /^1\.e4\s+e5\s+\d\.Nf3\s+Nf6/, "Petrov Defense"],
  ["C43", /^1\.e4\s+e5\s+\d\.Nf3\s+Nf6\s+\d\.d4/, "Petrov Defense"],
  ["C44", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6/, "King's Knight Opening"],
  ["C45", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.d4/, "Scotch Game"],
  ["C46", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Nc3/, "Three Knights Game"],
  ["C47", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Nc3\s+Nf6/, "Four Knights Game"],
  ["C48", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Nc3\s+Nf6\s+\d\.Bb5/, "Four Knights Spanish"],
  ["C49", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Nc3\s+Nf6\s+\d\.Bb5\s+Bb4/, "Four Knights Game"],
  ["C50", /^1\.e4\s+e5\s+\d\.Bc4/, "Italian Game"],
  ["C51", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.c3/, "Italian Game"],
  ["C52", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.c3\s+d5/, "Italian Game"],
  ["C53", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.c3\s+Bc5/, "Giuoco Piano"],
  ["C54", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.Nf3/, "Italian Game"],
  ["C55", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.Nf3\s+Nf6/, "Two Knights Defense"],
  ["C56", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.Nf3\s+Nf6\s+\d\.d4/, "Two Knights Defense"],
  ["C57", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.Nf3\s+Nf6\s+\d\.Ng5/, "Traxler Variation"],
  ["C58", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.Nf3\s+Nf6\s+\d\.Nc3/, "Polish Variation"],
  ["C59", /^1\.e4\s+e5\s+\d\.Bc4\s+Nc6\s+\d\.Nf3\s+Nf6\s+\d\.Ng5\s+d5/, "Twin Variation"],
  ["C60", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5/, "Ruy Lopez"],
  ["C63", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+Nf6/, "Ruy Lopez"],
  ["C64", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+Bc5/, "Ruy Lopez"],
  ["C65", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+Nf6\s+\d\.O-O/, "Ruy Lopez"],
  ["C66", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+Nf6\s+\d\.O-O\s+d6/, "Ruy Lopez"],
  ["C68", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6/, "Ruy Lopez Exchange"],
  ["C69", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6/, "Ruy Lopez Exchange"],
  ["C70", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O/, "Ruy Lopez"],
  ["C78", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Bb4/, "Ruy Lopez"],
  ["C80", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Nf6/, "Ruy Lopez Open"],
  ["C82", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Bc5/, "Open Ruy Lopez"],
  ["C83", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Nf6/, "Ruy Lopez Open"],
  ["C84", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O/, "Ruy Lopez Closed"],
  ["C85", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.c3/, "Ruy Lopez"],
  ["C86", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.c3\s+Bc5/, "Ruy Lopez"],
  ["C88", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7/, "Ruy Lopez"],
  ["C89", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.c3/, "Ruy Lopez Marshall"],
  ["C90", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+b5/, "Ruy Lopez"],
  ["C92", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+b5\s+\d\.Bb3/, "Ruy Lopez Closed"],
  ["C93", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+b5\s+\d\.Bb3\s+d6/, "Ruy Lopez Smyslov"],
  ["C94", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+b5\s+\d\.Bb3\s+d6\s+\d\.c3/, "Ruy Lopez"],
  ["C95", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+b5\s+\d\.Bb3\s+d6\s+\d\.c3\s+O-O/, "Ruy Lopez"],
  ["C96", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+Nc6/, "Ruy Lopez"],
  ["C97", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+Nc6\s+\d\.c3\s+d6/, "Ruy Lopez"],
  ["C98", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+Nc6\s+\d\.c3\s+d6\s+\d\.Nc3/, "Ruy Lopez"],
  ["C99", /^1\.e4\s+e5\s+\d\.Nf3\s+Nc6\s+\d\.Bb5\s+a6\s+\d\.Ba4\s+Nf6\s+\d\.O-O\s+Be7\s+\d\.Re1\s+Nc6\s+\d\.c3\s+d6\s+\d\.Nc3\s+Nc5/, "Ruy Lopez"],
  
  ["D00", /^1\.d4\s+d5/, "Queen's Pawn Game"],
  ["D01", /^1\.d4\s+d5\s+\d\.Nc3/, "Richter-Veresov Attack"],
  ["D02", /^1\.d4\s+d5\s+\d\.Nf3/, "London System"],
  ["D03", /^1\.d4\s+d5\s+\d\.Nf3\s+Nf6/, "London System"],
  ["D06", /^1\.d4\s+d5/, "Queen's Gambit"],
  ["D07", /^1\.d4\s+d5\s+\d\.c4\s+Nc6/, "Chigorin Defense"],
  ["D08", /^1\.d4\s+d5\s+\d\.c4\s+e5/, "Albin Countergambit"],
  ["D10", /^1\.d4\s+d5\s+\d\.c4\s+c6/, "Slav Defense"],
  ["D11", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nf3/, "Slav Defense"],
  ["D12", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nf3\s+Nf6\s+\d\.e3/, "Slav Defense"],
  ["D13", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nf3\s+Nf6\s+\d\.c3/, "Slav Defense"],
  ["D14", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nf3\s+Nf6\s+\d\.c3\s+Bf5/, "Slav Defense"],
  ["D15", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nf3\s+Nf6\s+\d\.Nc3/, "Slav Defense"],
  ["D17", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nf3\s+Nf6\s+\d\.c4\s+Nc6/, "Czech Benoni"],
  ["D20", /^1\.d4\s+d5\s+\d\.c4/, "Queen's Gambit Accepted"],
  ["D21", /^1\.d4\s+d5\s+\d\.c4\s+d4/, "Queens Gambit Accepted"],
  ["D22", /^1\.d4\s+d5\s+\d\.c4\s+d4\s+\d\.Nf3\s+Nf6/, "Alekhine's Defense"],
  ["D30", /^1\.d4\s+d5\s+\d\.c4/, "Queen's Gambit"],
  ["D31", /^1\.d4\s+d5\s+\d\.c4\s+e6/, "Queen's Gambit Declined"],
  ["D32", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3/, "Tarrasch Defense"],
  ["D33", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+c5/, "Tarrasch Defense"],
  ["D34", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+c5\s+\d\.cd/, "Tarrasch Defense"],
  ["D35", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6/, "Queen's Gambit Declined"],
  ["D36", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.cd/, "QGD Exchange"],
  ["D37", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.Nf3/, "QGD Classical"],
  ["D43", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nc3\s+Nf6/, "Semi-Slav Defense"],
  ["D44", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nc3\s+Nf6\s+\d\.Nf3\s+Bb7/, "Semi-Slav"],
  ["D45", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nc3\s+Nf6\s+\d\.e3/, "Semi-Slav Defense"],
  ["D46", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nc3\s+Nf6\s+\d\.e3\s+e6/, "Semi-Slav Defense"],
  ["D47", /^1\.d4\s+d5\s+\d\.c4\s+c6\s+\d\.Nc3\s+Nf6\s+\d\.e3\s+e6\s+\d\.Nf3\s+Nd7/, "Meran Variation"],
  ["D50", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.Bg5/, "QGD 4.Bg5"],
  ["D51", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.Bg5\s+Nbd7/, "QGD 4.Bg5"],
  ["D52", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.Bg5\s+Nbd7\s+\d\.e3\s+c5/, "Cambridge Springs"],
  ["D53", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.Bg5\s+Be7/, "QGD 4.Bg5"],
  ["D60", /^1\.d4\s+d5\s+\d\.c4\s+e6\s+\d\.Nc3\s+Nf6\s+\d\.Bg5\s+Be7\s+\d\.e3\s+O-O/, "QGD Orthodox"],
  ["D70", /^1\.d4\s+Nf6/, "Grunfeld Defense"],
  ["D71", /^1\.d4\s+Nf6\s+\d\.c4\s+g6/, "Grunfeld Defense"],
  ["D80", /^1\.d4\s+Nf6\s+\d\.c4\s+g6/, "Grunfeld Defense"],
  ["D85", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+d5/, "Grunfeld Defense"],
  ["D86", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+d5\s+\d\.cd/, "Grunfeld Defense"],
  ["D87", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+d5\s+\d\.cd\s+Nd5/, "Grunfeld Exchange"],
  ["D90", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+d5\s+\d\.cd\s+Nd5\s+\d\.Nf3/, "Grunfeld"],
  
  ["E00", /^1\.d4\s+Nf6\s+\d\.c4\s+e6/, "Catalan Opening"],
  ["E01", /^1\.d4\s+Nf6\s+\d\.c4\s+e6\s+\d\.g3/, "Catalan Opening"],
  ["E12", /^1\.d4\s+Nf6\s+\d\.Nf3\s+b6/, "Queen's Indian Defense"],
  ["E20", /^1\.d4\s+Nf6\s+\d\.c4\s+e6\s+\d\.Nc3\s+Bb4/, "Nimzo-Indian Defense"],
  ["E21", /^1\.d4\s+Nf6\s+\d\.c4\s+e6\s+\d\.Nc3\s+Bb4\s+\d\.Nf3/, "Nimzo-Indian Defense"],
  ["E32", /^1\.d4\s+Nf6\s+\d\.c4\s+e6\s+\d\.Nc3\s+Bb4\s+\d\.c3/, "Nimzo-Indian Defense"],
  ["E60", /^1\.d4\s+Nf6/, "King's Indian Defense"],
  ["E61", /^1\.d4\s+Nf6\s+\d\.c4\s+b6/, "King's Indian Defense"],
  ["E70", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3/, "King's Indian Defense"],
  ["E76", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+d5/, "King's Indian Defense"],
  ["E80", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+d5/, "King's Indian Samisch"],
  ["E90", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+Bg7\s+\d\.e4\s+d6/, "King's Indian Defense"],
  ["E97", /^1\.d4\s+Nf6\s+\d\.c4\s+g6\s+\d\.Nc3\s+Bg7\s+\d\.e4\s+d6\s+\d\.Nf3\s+O-O\s+\d\.Be2\s+e5/, "Classical Variation"],
];

const OPENING_MAP: Record<string, string> = {};

for (const [code, , name] of OPENINGS) {
  if (!OPENING_MAP[code]) {
    OPENING_MAP[code] = name;
  }
}

export interface OpeningInfo {
  code: string;
  name: string;
  family: string;
}

export function classifyOpening(movesStr: string): OpeningInfo {
  if (!movesStr) {
    return { code: "A00", name: "Irregular", family: "Irregular" };
  }

  for (const [code, pattern, name] of OPENINGS) {
    if (pattern.test(movesStr)) {
      const familyCode = code[0] + "00";
      const family = OPENING_MAP[familyCode] || "Opening";
      return { code, name, family };
    }
  }

  return { code: "A00", name: "Irregular", family: "Irregular" };
}

export function getOpeningName(eco: string): string {
  if (!eco) return "Unknown Opening";
  const info = classifyOpening("");
  return OPENING_MAP[eco] || info.name;
}

export function getOpeningFamily(eco: string): string {
  if (!eco) return "Irregular";
  const familyCode = eco[0] + "00";
  return OPENING_MAP[familyCode] || "Irregular";
}
