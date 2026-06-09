class UserService {
  constructor() {
    // 🔴 SECURITY: Hardcoded API key
    this.apiKey = "sk-1234567890abcdef";
    this.users = [];
  }

  // 🐛 BUG: No null check
  getUserById(id) {
    const user = this.users.find(u => u.id === id);
    return user.name; // Will crash if user is undefined
  }

  // ⚡ PERFORMANCE: O(n²) complexity
  findDuplicates() {
    const dupes = [];
    for (let i = 0; i < this.users.length; i++) {
      for (let j = i + 1; j < this.users.length; j++) {
        if (this.users[i].email === this.users[j].email) {
          dupes.push(this.users[i]);
        }
      }
    }
    return dupes;
  }
}

module.exports = UserService;