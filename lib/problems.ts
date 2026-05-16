import type { DSAPattern, ProblemInfo, Language } from './types';

// All problems kept exactly as-is — same categories, same order
export const DSA_PATTERNS: DSAPattern[] = [
  {
    category: "Arrays & Hashing",
    problems: ["Training: Arrays & Hashing", "Two Sum", "Contains Duplicate", "Valid Anagram", "Group Anagrams", "Product of Array Except Self", "Longest Consecutive Sequence", "Decode the Slanted Ciphertext"]
  },
  {
    category: "Prefix & Suffix Patterns",
    problems: [
      "Training: Prefix & Suffix Patterns",
      "Prefix Max", "Prefix Min", "Prefix Sum", "Prefix Product",
      "Suffix Max", "Suffix Min", "Suffix Sum", "Suffix Product"
    ]
  },
  {
    category: "Top K Pattern",
    problems: ["Training: Top K Pattern", "Top K Frequent Elements"]
  },
  {
    category: "Two Pointers",
    problems: ["Training: Two Pointers", "Valid Palindrome", "3Sum", "Container With Most Water"]
  },
  {
    category: "Sliding Window",
    problems: ["Training: Sliding Window", "Best Time to Buy & Sell Stock", "Longest Substring Without Repeating"]
  },
  {
    category: "Stack",
    problems: ["Training: Stack", "Valid Parentheses"]
  },
  {
    category: "Binary Search",
    problems: ["Training: Binary Search", "Find Minimum in Rotated Sorted Array"]
  },
  {
    category: "Linked List",
    problems: ["Training: Linked List", "Reverse Linked List", "Merge Two Sorted Lists", "Linked List Cycle"]
  },
  {
    category: "Trees",
    problems: ["Training: Trees", "Invert Binary Tree", "Maximum Depth of Binary Tree"]
  },
  {
    category: "1-D Dynamic Programming",
    problems: ["Training: 1-D Dynamic Programming", "Climbing Stairs", "House Robber"]
  }
];

export const PROBLEM_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard'> = {
  "Two Sum": 'easy', "Contains Duplicate": 'easy', "Valid Anagram": 'easy',
  "Valid Palindrome": 'easy', "Valid Parentheses": 'easy', "Climbing Stairs": 'easy',
  "Reverse Linked List": 'easy', "Invert Binary Tree": 'easy', "Maximum Depth of Binary Tree": 'easy',
  "Best Time to Buy & Sell Stock": 'easy', "Prefix Max": 'easy', "Prefix Min": 'easy',
  "Prefix Sum": 'easy', "Prefix Product": 'easy', "Suffix Max": 'easy', "Suffix Min": 'easy',
  "Suffix Sum": 'easy', "Suffix Product": 'easy',
  "Group Anagrams": 'medium', "Top K Frequent Elements": 'medium', "Product of Array Except Self": 'medium',
  "3Sum": 'medium', "Container With Most Water": 'medium', "Longest Substring Without Repeating": 'medium',
  "Find Minimum in Rotated Sorted Array": 'medium', "Merge Two Sorted Lists": 'medium',
  "Linked List Cycle": 'medium', "House Robber": 'medium', "Decode the Slanted Ciphertext": 'medium',
  "Longest Consecutive Sequence": 'hard',
};

export const PROBLEM_INFO: Record<string, ProblemInfo> = {
  "Two Sum": { params: ["nums", "target"], example: "nums = [2,7,11,15], target = 9 -> [0,1]", difficulty: 'easy' },
  "Contains Duplicate": { params: ["nums"], example: "nums = [1,2,3,1] -> true", difficulty: 'easy' },
  "Valid Anagram": { params: ["s", "t"], example: 's = "anagram", t = "nagaram" -> true', difficulty: 'easy' },
  "Group Anagrams": { params: ["strs"], example: 'strs = ["eat","tea","tan","ate","nat","bat"] -> [["bat"],["nat","tan"],["ate","eat","tea"]]', prerequisites: ["Valid Anagram"], difficulty: 'medium' },
  "Top K Frequent Elements": { params: ["nums", "k"], example: "nums = [1,1,1,2,2,3], k = 2 -> [1,2]", prerequisites: ["Training: Top K Pattern"], difficulty: 'medium' },
  "Product of Array Except Self": { params: ["nums"], example: "nums = [1,2,3,4] -> [24,12,8,6]", difficulty: 'medium' },
  "Longest Consecutive Sequence": { params: ["nums"], example: "nums = [100,4,200,1,3,2] -> 4", difficulty: 'hard' },
  "Decode the Slanted Ciphertext": { params: ["encodedText", "rows"], example: 'encodedText = "coding", rows = 1 -> "coding"', difficulty: 'medium' },
  "Valid Palindrome": { params: ["s"], example: '"A man, a plan, a canal: Panama" -> true', difficulty: 'easy' },
  "3Sum": { params: ["nums"], example: "nums = [-1,0,1,2,-1,-4] -> [[-1,-1,2],[-1,0,1]]", prerequisites: ["Training: Two Pointers"], difficulty: 'medium' },
  "Container With Most Water": { params: ["height"], example: "height = [1,8,6,2,5,4,8,3,7] -> 49", difficulty: 'medium' },
  "Best Time to Buy & Sell Stock": { params: ["prices"], example: "prices = [7,1,5,3,6,4] -> 5", difficulty: 'easy' },
  "Longest Substring Without Repeating": { params: ["s"], example: 's = "abcabcbb" -> 3', difficulty: 'medium' },
  "Valid Parentheses": { params: ["s"], example: 's = "()[]{}" -> true', difficulty: 'easy' },
  "Find Minimum in Rotated Sorted Array": { params: ["nums"], example: "nums = [3,4,5,1,2] -> 1", difficulty: 'medium' },
  "Reverse Linked List": { params: ["head"], example: "head = [1,2,3,4,5] -> [5,4,3,2,1]", difficulty: 'easy' },
  "Merge Two Sorted Lists": { params: ["list1", "list2"], example: "list1 = [1,2,4], list2 = [1,3,4] -> [1,1,2,3,4,4]", difficulty: 'medium' },
  "Linked List Cycle": { params: ["head"], example: "head = [3,2,0,-4], pos = 1 -> true", difficulty: 'medium' },
  "Invert Binary Tree": { params: ["root"], example: "root = [4,2,7,1,3,6,9] -> [4,7,2,9,6,3,1]", difficulty: 'easy' },
  "Maximum Depth of Binary Tree": { params: ["root"], example: "root = [3,9,20,null,null,15,7] -> 3", difficulty: 'easy' },
  "Climbing Stairs": { params: ["n"], example: "n = 2 -> 2", difficulty: 'easy' },
  "House Robber": { params: ["nums"], example: "nums = [1,2,3,1] -> 4", difficulty: 'medium' },
  "Prefix Max": { params: ["arr"], example: "arr = [2, 1, 5, 3, 4] -> [2, 2, 5, 5, 5]", difficulty: 'easy' },
  "Prefix Min": { params: ["arr"], example: "arr = [3, 1, 4, 2, 5] -> [3, 1, 1, 1, 1]", difficulty: 'easy' },
  "Prefix Sum": { params: ["arr"], example: "arr = [2, 1, 3, 4] -> [2, 3, 6, 10]", difficulty: 'easy' },
  "Prefix Product": { params: ["arr"], example: "arr = [1, 2, 3, 4] -> [1, 2, 6, 24]", difficulty: 'easy' },
  "Suffix Max": { params: ["arr"], example: "arr = [2, 1, 5, 3, 4] -> [5, 5, 5, 4, 4]", difficulty: 'easy' },
  "Suffix Min": { params: ["arr"], example: "arr = [3, 1, 4, 2, 5] -> [1, 1, 2, 2, 5]", difficulty: 'easy' },
  "Suffix Sum": { params: ["arr"], example: "arr = [2, 1, 3, 4] -> [10, 8, 7, 4]", difficulty: 'easy' },
  "Suffix Product": { params: ["arr"], example: "arr = [1, 2, 3, 4] -> [24, 24, 12, 4]", difficulty: 'easy' },
  "Training: Arrays & Hashing": { params: ["nums"], example: "nums = [1,2,3] -> [1,2,3]" },
  "Training: Prefix & Suffix Patterns": { params: ["arr"], example: "arr = [1,2,3] -> [1,2,3]" },
  "Training: Top K Pattern": { params: ["nums", "k"], example: "nums = [1,1,1,2,2,3], k = 2 -> [1,2]" },
  "Training: Two Pointers": { params: ["nums"], example: "nums = [1,2,3] -> [1,2,3]" },
  "Training: Sliding Window": { params: ["nums"], example: "nums = [1,2,3] -> [1,2,3]" },
  "Training: Stack": { params: ["s"], example: 's = "()" -> true' },
  "Training: Binary Search": { params: ["nums", "target"], example: "nums = [1,2,3], target = 2 -> 1" },
  "Training: Linked List": { params: ["head"], example: "head = [1,2,3] -> [1,2,3]" },
  "Training: Trees": { params: ["root"], example: "root = [1,2,3] -> [1,2,3]" },
  "Training: 1-D Dynamic Programming": { params: ["n"], example: "n = 2 -> 2" },
};

export const AI_PROVIDERS = [
  { id: 'gemini', name: 'Gemini', models: ['gemini-3.1-pro-preview', 'gemini-3-flash-preview'] },
  { id: 'mistral', name: 'Mistral', models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'] },
  { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
  { id: 'openrouter', name: 'OpenRouter', models: ['mistralai/mistral-7b-instruct:free', 'google/gemma-7b:free', 'meta-llama/llama-3.1-8b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free'] },
];

export const getStarterCode = (problem: string, lang: Language): string => {
  const info = PROBLEM_INFO[problem] || { params: ["nums"] };
  const safeName = problem.replace(/[^a-zA-Z0-9]/g, '');
  const camelCase = safeName.charAt(0).toLowerCase() + safeName.slice(1);
  const snake_case = safeName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  const jsParams = info.params.join(', ');
  const pyParams = info.params.join(', ');
  const javaParams = info.params.map(p => `Object ${p}`).join(', ');
  const cppParams = info.params.map(p => `auto ${p}`).join(', ');
  const exampleComment = info.example ? `\n * Example: ${info.example}` : '';
  const pyExampleComment = info.example ? `\n        # Example: ${info.example}` : '';

  switch (lang) {
    case 'python':
      return `class Solution:\n    def ${snake_case}(self, ${pyParams}):${pyExampleComment}\n        # Write your code here\n        pass`;
    case 'javascript': {
      let testCall = `// console.log(${camelCase}(/* args */));`;
      if (info.example) {
        const argsPart = info.example.split('->')[0].trim();
        const values = argsPart.split(',').map(s => {
          const parts = s.split('=');
          return parts.length > 1 ? parts[1].trim() : s.trim();
        }).join(', ');
        testCall = `// console.log(${camelCase}(${values}));`;
      }
      return `/**\n * Mission: ${problem}${exampleComment}\n */\nvar ${camelCase} = function(${jsParams}) {\n    // Write your code here\n};\n\n// Test your code:\n${testCall}`;
    }
    case 'java':
      return `class Solution {\n    public Object ${camelCase}(${javaParams}) {\n        // Write your code here\n        return null;\n    }\n}`;
    case 'cpp':
      return `class Solution {\npublic:\n    auto ${camelCase}(${cppParams}) {\n        // Write your code here\n    }\n};`;
    default:
      return '// Write your code here';
  }
};
