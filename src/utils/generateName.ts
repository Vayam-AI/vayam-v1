export const generateName = () => {
    // Consonants and vowels for creating pronounceable combinations
    const consonants = "bcdfghjklmnpqrstvwxyz";
    const vowels = "aeiou";
    const numbers = "0123456789";
  
    let result = "";
    
    // Decide which positions will be numbers (1-2 numbers total)
    const numCount = Math.random() > 0.7 ? 2 : 1;
    const numberPositions: number[] = [];
    
    // Choose random positions for numbers
    while (numberPositions.length < numCount) {
      const pos = Math.floor(Math.random() * 6);
      if (!numberPositions.includes(pos)) {
        numberPositions.push(pos);
      }
    }
    
    // Generate each character
    for (let i = 0; i < 6; i++) {
      if (numberPositions.includes(i)) {
        // Add a random number
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      } else {
        // Add a letter, alternating between consonants and vowels for pronounceability
        if (i === 0 || (i > 0 && consonants.includes(result.charAt(i-1).toLowerCase()))) {
          result += vowels.charAt(Math.floor(Math.random() * vowels.length));
        } else {
          result += consonants.charAt(Math.floor(Math.random() * consonants.length));
        }
      }
    }
  
    // Capitalize first letter to make it look more like a name
    return result.charAt(0).toUpperCase() + result.slice(1);
  };