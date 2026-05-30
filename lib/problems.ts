import type { DSAPattern, ProblemInfo, Language } from './types';

// ======================================================
// DSA PATTERNS - Updated Full NeetCode 150
// Custom Sandbox kept as-is
// ======================================================

export const DSA_PATTERNS: DSAPattern[] = [
  {
    category: "Personal Practice",
    problems: ["Training: Custom Sandbox"]
  },

  {
    category: "Arrays & Hashing",
    problems: [
      "Contains Duplicate",
      "Valid Anagram",
      "Two Sum",
      "Group Anagrams",
      "Top K Frequent Elements",
      "Encode and Decode Strings",
      "Product of Array Except Self",
      "Valid Sudoku",
      "Longest Consecutive Sequence"
    ]
  },

  {
    category: "Two Pointers",
    problems: [
      "Valid Palindrome",
      "Two Sum II Input Array Is Sorted",
      "3Sum",
      "Container With Most Water",
      "Trapping Rain Water"
    ]
  },

  {
    category: "Stack",
    problems: [
      "Valid Parentheses",
      "Min Stack",
      "Evaluate Reverse Polish Notation",
      "Daily Temperatures",
      "Car Fleet",
      "Largest Rectangle In Histogram"
    ]
  },

  {
    category: "Binary Search",
    problems: [
      "Binary Search",
      "Search a 2D Matrix",
      "Koko Eating Bananas",
      "Find Minimum In Rotated Sorted Array",
      "Search In Rotated Sorted Array",
      "Time Based Key Value Store",
      "Median of Two Sorted Arrays"
    ]
  },

  {
    category: "Sliding Window",
    problems: [
      "Best Time to Buy And Sell Stock",
      "Longest Substring Without Repeating Characters",
      "Longest Repeating Character Replacement",
      "Permutation In String",
      "Minimum Window Substring",
      "Sliding Window Maximum"
    ]
  },

  {
    category: "Linked List",
    problems: [
      "Reverse Linked List",
      "Merge Two Sorted Lists",
      "Linked List Cycle",
      "Reorder List",
      "Remove Nth Node From End of List",
      "Copy List With Random Pointer",
      "Add Two Numbers",
      "Find The Duplicate Number",
      "LRU Cache",
      "Merge K Sorted Lists",
      "Reverse Nodes In K Group"
    ]
  },

  {
    category: "Trees",
    problems: [
      "Invert Binary Tree",
      "Maximum Depth of Binary Tree",
      "Diameter of Binary Tree",
      "Balanced Binary Tree",
      "Same Tree",
      "Subtree of Another Tree",
      "Lowest Common Ancestor of a Binary Search Tree",
      "Binary Tree Level Order Traversal",
      "Binary Tree Right Side View",
      "Count Good Nodes In Binary Tree",
      "Validate Binary Search Tree",
      "Kth Smallest Element In a Bst",
      "Construct Binary Tree From Preorder And Inorder Traversal",
      "Binary Tree Maximum Path Sum",
      "Serialize And Deserialize Binary Tree"
    ]
  },

  {
    category: "Tries",
    problems: [
      "Implement Trie Prefix Tree",
      "Design Add And Search Words Data Structure",
      "Word Search II"
    ]
  },

  {
    category: "Heap / Priority Queue",
    problems: [
      "Kth Largest Element In a Stream",
      "Last Stone Weight",
      "K Closest Points to Origin",
      "Kth Largest Element In An Array",
      "Task Scheduler",
      "Design Twitter",
      "Find Median From Data Stream"
    ]
  },

  {
    category: "Backtracking",
    problems: [
      "Subsets",
      "Combination Sum",
      "Combination Sum II",
      "Permutations",
      "Subsets II",
      "Generate Parentheses",
      "Word Search",
      "Palindrome Partitioning",
      "Letter Combinations of a Phone Number",
      "N Queens"
    ]
  },

  {
    category: "Graphs",
    problems: [
      "Number of Islands",
      "Max Area of Island",
      "Clone Graph",
      "Walls And Gates",
      "Rotting Oranges",
      "Pacific Atlantic Water Flow",
      "Surrounded Regions",
      "Course Schedule",
      "Course Schedule II",
      "Graph Valid Tree",
      "Number of Connected Components In An Undirected Graph",
      "Redundant Connection",
      "Word Ladder"
    ]
  },

  {
    category: "1-D Dynamic Programming",
    problems: [
      "Climbing Stairs",
      "Min Cost Climbing Stairs",
      "House Robber",
      "House Robber II",
      "Longest Palindromic Substring",
      "Palindromic Substrings",
      "Decode Ways",
      "Coin Change",
      "Maximum Product Subarray",
      "Word Break",
      "Longest Increasing Subsequence",
      "Partition Equal Subset Sum"
    ]
  },

  {
    category: "Intervals",
    problems: [
      "Insert Interval",
      "Merge Intervals",
      "Non Overlapping Intervals",
      "Meeting Rooms",
      "Meeting Rooms II",
      "Minimum Interval to Include Each Query"
    ]
  },

  {
    category: "Greedy",
    problems: [
      "Maximum Subarray",
      "Jump Game",
      "Jump Game II",
      "Gas Station",
      "Hand of Straights",
      "Merge Triplets to Form Target Triplet",
      "Partition Labels",
      "Valid Parenthesis String"
    ]
  },

  {
    category: "Advanced Graphs",
    problems: [
      "Network Delay Time",
      "Reconstruct Itinerary",
      "Min Cost to Connect All Points",
      "Swim In Rising Water",
      "Alien Dictionary",
      "Cheapest Flights Within K Stops"
    ]
  },

  {
    category: "2-D Dynamic Programming",
    problems: [
      "Unique Paths",
      "Longest Common Subsequence",
      "Best Time to Buy And Sell Stock With Cooldown",
      "Coin Change II",
      "Target Sum",
      "Interleaving String",
      "Longest Increasing Path In a Matrix",
      "Distinct Subsequences",
      "Edit Distance",
      "Burst Balloons",
      "Regular Expression Matching"
    ]
  },

  {
    category: "Bit Manipulation",
    problems: [
      "Single Number",
      "Number of 1 Bits",
      "Counting Bits",
      "Reverse Bits",
      "Missing Number",
      "Sum of Two Integers",
      "Reverse Integer"
    ]
  },

  {
    category: "Math & Geometry",
    problems: [
      "Rotate Image",
      "Spiral Matrix",
      "Set Matrix Zeroes",
      "Happy Number",
      "Plus One",
      "Pow(x, n)",
      "Multiply Strings",
      "Detect Squares"
    ]
  }
];

// ======================================================
// DIFFICULTY MAP
// ======================================================

export const PROBLEM_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard'> = {
  "Contains Duplicate": 'easy',
  "Valid Anagram": 'easy',
  "Two Sum": 'easy',
  "Group Anagrams": 'medium',
  "Top K Frequent Elements": 'medium',
  "Encode and Decode Strings": 'medium',
  "Product of Array Except Self": 'medium',
  "Valid Sudoku": 'medium',
  "Longest Consecutive Sequence": 'medium',

  "Valid Palindrome": 'easy',
  "Two Sum II Input Array Is Sorted": 'medium',
  "3Sum": 'medium',
  "Container With Most Water": 'medium',
  "Trapping Rain Water": 'hard',

  "Best Time to Buy And Sell Stock": 'easy',
  "Longest Substring Without Repeating Characters": 'medium',
  "Longest Repeating Character Replacement": 'medium',
  "Permutation In String": 'medium',
  "Minimum Window Substring": 'hard',
  "Sliding Window Maximum": 'hard',

  "Valid Parentheses": 'easy',
  "Min Stack": 'medium',
  "Evaluate Reverse Polish Notation": 'medium',
  "Daily Temperatures": 'medium',
  "Car Fleet": 'medium',
  "Largest Rectangle In Histogram": 'hard',

  "Binary Search": 'easy',
  "Search a 2D Matrix": 'medium',
  "Koko Eating Bananas": 'medium',
  "Find Minimum In Rotated Sorted Array": 'medium',
  "Search In Rotated Sorted Array": 'medium',
  "Time Based Key Value Store": 'medium',
  "Median of Two Sorted Arrays": 'hard',

  "Reverse Linked List": 'easy',
  "Merge Two Sorted Lists": 'easy',
  "Linked List Cycle": 'easy',
  "Reorder List": 'medium',
  "Remove Nth Node From End of List": 'medium',
  "Copy List With Random Pointer": 'medium',
  "Add Two Numbers": 'medium',
  "Find The Duplicate Number": 'medium',
  "LRU Cache": 'medium',
  "Merge K Sorted Lists": 'hard',
  "Reverse Nodes In K Group": 'hard',

  "Invert Binary Tree": 'easy',
  "Maximum Depth of Binary Tree": 'easy',
  "Diameter of Binary Tree": 'easy',
  "Balanced Binary Tree": 'easy',
  "Same Tree": 'easy',
  "Subtree of Another Tree": 'easy',
  "Lowest Common Ancestor of a Binary Search Tree": 'medium',
  "Binary Tree Level Order Traversal": 'medium',
  "Binary Tree Right Side View": 'medium',
  "Count Good Nodes In Binary Tree": 'medium',
  "Validate Binary Search Tree": 'medium',
  "Kth Smallest Element In a Bst": 'medium',
  "Construct Binary Tree From Preorder And Inorder Traversal": 'medium',
  "Binary Tree Maximum Path Sum": 'hard',
  "Serialize And Deserialize Binary Tree": 'hard',

  "Kth Largest Element In a Stream": 'easy',
  "Last Stone Weight": 'easy',
  "K Closest Points to Origin": 'medium',
  "Kth Largest Element In An Array": 'medium',
  "Task Scheduler": 'medium',
  "Design Twitter": 'medium',
  "Find Median From Data Stream": 'hard',

  "Subsets": 'medium',
  "Combination Sum": 'medium',
  "Combination Sum II": 'medium',
  "Permutations": 'medium',
  "Subsets II": 'medium',
  "Generate Parentheses": 'medium',
  "Word Search": 'medium',
  "Palindrome Partitioning": 'medium',
  "Letter Combinations of a Phone Number": 'medium',
  "N Queens": 'hard',

  "Implement Trie Prefix Tree": 'medium',
  "Design Add And Search Words Data Structure": 'medium',
  "Word Search II": 'hard',

  "Number of Islands": 'medium',
  "Max Area of Island": 'medium',
  "Clone Graph": 'medium',
  "Walls And Gates": 'medium',
  "Rotting Oranges": 'medium',
  "Pacific Atlantic Water Flow": 'medium',
  "Surrounded Regions": 'medium',
  "Course Schedule": 'medium',
  "Course Schedule II": 'medium',
  "Graph Valid Tree": 'medium',
  "Number of Connected Components In An Undirected Graph": 'medium',
  "Redundant Connection": 'medium',
  "Word Ladder": 'hard',

  "Network Delay Time": 'medium',
  "Reconstruct Itinerary": 'hard',
  "Min Cost to Connect All Points": 'medium',
  "Swim In Rising Water": 'hard',
  "Alien Dictionary": 'hard',
  "Cheapest Flights Within K Stops": 'medium',

  "Climbing Stairs": 'easy',
  "Min Cost Climbing Stairs": 'easy',
  "House Robber": 'medium',
  "House Robber II": 'medium',
  "Longest Palindromic Substring": 'medium',
  "Palindromic Substrings": 'medium',
  "Decode Ways": 'medium',
  "Coin Change": 'medium',
  "Maximum Product Subarray": 'medium',
  "Word Break": 'medium',
  "Longest Increasing Subsequence": 'medium',
  "Partition Equal Subset Sum": 'medium',

  "Unique Paths": 'medium',
  "Longest Common Subsequence": 'medium',
  "Best Time to Buy And Sell Stock With Cooldown": 'medium',
  "Coin Change II": 'medium',
  "Target Sum": 'medium',
  "Interleaving String": 'hard',
  "Longest Increasing Path In a Matrix": 'hard',
  "Distinct Subsequences": 'hard',
  "Edit Distance": 'hard',
  "Burst Balloons": 'hard',
  "Regular Expression Matching": 'hard',

  "Maximum Subarray": 'medium',
  "Jump Game": 'medium',
  "Jump Game II": 'medium',
  "Gas Station": 'medium',
  "Hand of Straights": 'medium',
  "Merge Triplets to Form Target Triplet": 'medium',
  "Partition Labels": 'medium',
  "Valid Parenthesis String": 'medium',

  "Insert Interval": 'medium',
  "Merge Intervals": 'medium',
  "Non Overlapping Intervals": 'medium',
  "Meeting Rooms": 'easy',
  "Meeting Rooms II": 'medium',
  "Minimum Interval to Include Each Query": 'hard',

  "Rotate Image": 'medium',
  "Spiral Matrix": 'medium',
  "Set Matrix Zeroes": 'medium',
  "Happy Number": 'easy',
  "Plus One": 'easy',
  "Pow(x, n)": 'medium',
  "Multiply Strings": 'medium',
  "Detect Squares": 'medium',

  "Single Number": 'easy',
  "Number of 1 Bits": 'easy',
  "Counting Bits": 'easy',
  "Reverse Bits": 'easy',
  "Missing Number": 'easy',
  "Sum of Two Integers": 'medium',
  "Reverse Integer": 'medium'
};

// ======================================================
// PROBLEM INFO
// ======================================================

export const PROBLEM_INFO: Record<string, ProblemInfo> = {

  // ── Personal Practice ──────────────────────────────
  "Training: Custom Sandbox": {
    params: ["...args"],
    example: "Practice any logic here — interview prep, custom problems, or recruiter questions."
  },

  // ── Arrays & Hashing ───────────────────────────────
  "Contains Duplicate": {
    params: ["nums"],
    example: "nums = [1,2,3,1] -> true",
    difficulty: 'easy'
  },
  "Valid Anagram": {
    params: ["s", "t"],
    example: 's = "anagram", t = "nagaram" -> true',
    difficulty: 'easy'
  },
  "Two Sum": {
    params: ["nums", "target"],
    example: "nums = [2,7,11,15], target = 9 -> [0,1]",
    difficulty: 'easy'
  },
  "Group Anagrams": {
    params: ["strs"],
    example: 'strs = ["eat","tea","tan","ate","nat","bat"] -> [["bat"],["nat","tan"],["ate","eat","tea"]]',
    difficulty: 'medium'
  },
  "Top K Frequent Elements": {
    params: ["nums", "k"],
    example: "nums = [1,1,1,2,2,3], k = 2 -> [1,2]",
    difficulty: 'medium'
  },
  "Encode and Decode Strings": {
    params: ["strs"],
    example: 'strs = ["lint","code","love","you"] -> "lint#code#love#you" -> ["lint","code","love","you"]',
    difficulty: 'medium'
  },
  "Product of Array Except Self": {
    params: ["nums"],
    example: "nums = [1,2,3,4] -> [24,12,8,6]",
    difficulty: 'medium'
  },
  "Valid Sudoku": {
    params: ["board"],
    example: "board = (9x9 partially filled grid) -> true",
    difficulty: 'medium'
  },
  "Longest Consecutive Sequence": {
    params: ["nums"],
    example: "nums = [100,4,200,1,3,2] -> 4",
    difficulty: 'medium'
  },

  // ── Two Pointers ───────────────────────────────────
  "Valid Palindrome": {
    params: ["s"],
    example: 's = "A man, a plan, a canal: Panama" -> true',
    difficulty: 'easy'
  },
  "Two Sum II Input Array Is Sorted": {
    params: ["numbers", "target"],
    example: "numbers = [2,7,11,15], target = 9 -> [1,2]",
    difficulty: 'medium'
  },
  "3Sum": {
    params: ["nums"],
    example: "nums = [-1,0,1,2,-1,-4] -> [[-1,-1,2],[-1,0,1]]",
    difficulty: 'medium'
  },
  "Container With Most Water": {
    params: ["height"],
    example: "height = [1,8,6,2,5,4,8,3,7] -> 49",
    difficulty: 'medium'
  },
  "Trapping Rain Water": {
    params: ["height"],
    example: "height = [0,1,0,2,1,0,1,3,2,1,2,1] -> 6",
    difficulty: 'hard'
  },

  // ── Stack ──────────────────────────────────────────
  "Valid Parentheses": {
    params: ["s"],
    example: 's = "()[]{}" -> true',
    difficulty: 'easy'
  },
  "Min Stack": {
    params: ["operations"],
    example: 'push(-2), push(0), push(-3), getMin() -> -3, pop(), top() -> 0, getMin() -> -2',
    difficulty: 'medium'
  },
  "Evaluate Reverse Polish Notation": {
    params: ["tokens"],
    example: 'tokens = ["2","1","+","3","*"] -> 9',
    difficulty: 'medium'
  },
  "Daily Temperatures": {
    params: ["temperatures"],
    example: "temperatures = [73,74,75,71,69,72,76,73] -> [1,1,4,2,1,1,0,0]",
    difficulty: 'medium'
  },
  "Car Fleet": {
    params: ["target", "position", "speed"],
    example: "target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3] -> 3",
    difficulty: 'medium'
  },
  "Largest Rectangle In Histogram": {
    params: ["heights"],
    example: "heights = [2,1,5,6,2,3] -> 10",
    difficulty: 'hard'
  },

  // ── Binary Search ──────────────────────────────────
  "Binary Search": {
    params: ["nums", "target"],
    example: "nums = [-1,0,3,5,9,12], target = 9 -> 4",
    difficulty: 'easy'
  },
  "Search a 2D Matrix": {
    params: ["matrix", "target"],
    example: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3 -> true",
    difficulty: 'medium'
  },
  "Koko Eating Bananas": {
    params: ["piles", "h"],
    example: "piles = [3,6,7,11], h = 8 -> 4",
    difficulty: 'medium'
  },
  "Find Minimum In Rotated Sorted Array": {
    params: ["nums"],
    example: "nums = [3,4,5,1,2] -> 1",
    difficulty: 'medium'
  },
  "Search In Rotated Sorted Array": {
    params: ["nums", "target"],
    example: "nums = [4,5,6,7,0,1,2], target = 0 -> 4",
    difficulty: 'medium'
  },
  "Time Based Key Value Store": {
    params: ["operations"],
    example: 'set("foo","bar",1), get("foo",1) -> "bar", get("foo",3) -> "bar"',
    difficulty: 'medium'
  },
  "Median of Two Sorted Arrays": {
    params: ["nums1", "nums2"],
    example: "nums1 = [1,3], nums2 = [2] -> 2.0",
    difficulty: 'hard'
  },

  // ── Sliding Window ─────────────────────────────────
  "Best Time to Buy And Sell Stock": {
    params: ["prices"],
    example: "prices = [7,1,5,3,6,4] -> 5",
    difficulty: 'easy'
  },
  "Longest Substring Without Repeating Characters": {
    params: ["s"],
    example: 's = "abcabcbb" -> 3',
    difficulty: 'medium'
  },
  "Longest Repeating Character Replacement": {
    params: ["s", "k"],
    example: 's = "AABABBA", k = 1 -> 4',
    difficulty: 'medium'
  },
  "Permutation In String": {
    params: ["s1", "s2"],
    example: 's1 = "ab", s2 = "eidbaooo" -> true',
    difficulty: 'medium'
  },
  "Minimum Window Substring": {
    params: ["s", "t"],
    example: 's = "ADOBECODEBANC", t = "ABC" -> "BANC"',
    difficulty: 'hard'
  },
  "Sliding Window Maximum": {
    params: ["nums", "k"],
    example: "nums = [1,3,-1,-3,5,3,6,7], k = 3 -> [3,3,5,5,6,7]",
    difficulty: 'hard'
  },

  // ── Linked List ────────────────────────────────────
  "Reverse Linked List": {
    params: ["head"],
    example: "head = [1,2,3,4,5] -> [5,4,3,2,1]",
    difficulty: 'easy'
  },
  "Merge Two Sorted Lists": {
    params: ["list1", "list2"],
    example: "list1 = [1,2,4], list2 = [1,3,4] -> [1,1,2,3,4,4]",
    difficulty: 'easy'
  },
  "Linked List Cycle": {
    params: ["head"],
    example: "head = [3,2,0,-4], pos = 1 -> true",
    difficulty: 'easy'
  },
  "Reorder List": {
    params: ["head"],
    example: "head = [1,2,3,4] -> [1,4,2,3]",
    difficulty: 'medium'
  },
  "Remove Nth Node From End of List": {
    params: ["head", "n"],
    example: "head = [1,2,3,4,5], n = 2 -> [1,2,3,5]",
    difficulty: 'medium'
  },
  "Copy List With Random Pointer": {
    params: ["head"],
    example: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]] -> deep copy of list",
    difficulty: 'medium'
  },
  "Add Two Numbers": {
    params: ["l1", "l2"],
    example: "l1 = [2,4,3], l2 = [5,6,4] -> [7,0,8]  (342 + 465 = 807)",
    difficulty: 'medium'
  },
  "Find The Duplicate Number": {
    params: ["nums"],
    example: "nums = [1,3,4,2,2] -> 2",
    difficulty: 'medium'
  },
  "LRU Cache": {
    params: ["capacity"],
    example: "capacity = 2, put(1,1), put(2,2), get(1) -> 1, put(3,3), get(2) -> -1",
    difficulty: 'medium'
  },
  "Merge K Sorted Lists": {
    params: ["lists"],
    example: "lists = [[1,4,5],[1,3,4],[2,6]] -> [1,1,2,3,4,4,5,6]",
    difficulty: 'hard'
  },
  "Reverse Nodes In K Group": {
    params: ["head", "k"],
    example: "head = [1,2,3,4,5], k = 2 -> [2,1,4,3,5]",
    difficulty: 'hard'
  },

  // ── Trees ──────────────────────────────────────────
  "Invert Binary Tree": {
    params: ["root"],
    example: "root = [4,2,7,1,3,6,9] -> [4,7,2,9,6,3,1]",
    difficulty: 'easy'
  },
  "Maximum Depth of Binary Tree": {
    params: ["root"],
    example: "root = [3,9,20,null,null,15,7] -> 3",
    difficulty: 'easy'
  },
  "Diameter of Binary Tree": {
    params: ["root"],
    example: "root = [1,2,3,4,5] -> 3",
    difficulty: 'easy'
  },
  "Balanced Binary Tree": {
    params: ["root"],
    example: "root = [3,9,20,null,null,15,7] -> true",
    difficulty: 'easy'
  },
  "Same Tree": {
    params: ["p", "q"],
    example: "p = [1,2,3], q = [1,2,3] -> true",
    difficulty: 'easy'
  },
  "Subtree of Another Tree": {
    params: ["root", "subRoot"],
    example: "root = [3,4,5,1,2], subRoot = [4,1,2] -> true",
    difficulty: 'easy'
  },
  "Lowest Common Ancestor of a Binary Search Tree": {
    params: ["root", "p", "q"],
    example: "root = [6,2,8,0,4,7,9], p = 2, q = 8 -> 6",
    difficulty: 'medium'
  },
  "Binary Tree Level Order Traversal": {
    params: ["root"],
    example: "root = [3,9,20,null,null,15,7] -> [[3],[9,20],[15,7]]",
    difficulty: 'medium'
  },
  "Binary Tree Right Side View": {
    params: ["root"],
    example: "root = [1,2,3,null,5,null,4] -> [1,3,4]",
    difficulty: 'medium'
  },
  "Count Good Nodes In Binary Tree": {
    params: ["root"],
    example: "root = [3,1,4,3,null,1,5] -> 4",
    difficulty: 'medium'
  },
  "Validate Binary Search Tree": {
    params: ["root"],
    example: "root = [2,1,3] -> true",
    difficulty: 'medium'
  },
  "Kth Smallest Element In a Bst": {
    params: ["root", "k"],
    example: "root = [3,1,4,null,2], k = 1 -> 1",
    difficulty: 'medium'
  },
  "Construct Binary Tree From Preorder And Inorder Traversal": {
    params: ["preorder", "inorder"],
    example: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7] -> [3,9,20,null,null,15,7]",
    difficulty: 'medium'
  },
  "Binary Tree Maximum Path Sum": {
    params: ["root"],
    example: "root = [-10,9,20,null,null,15,7] -> 42",
    difficulty: 'hard'
  },
  "Serialize And Deserialize Binary Tree": {
    params: ["root"],
    example: "root = [1,2,3,null,null,4,5] -> '1,2,3,null,null,4,5' -> [1,2,3,null,null,4,5]",
    difficulty: 'hard'
  },

  // ── Tries ──────────────────────────────────────────
  "Implement Trie Prefix Tree": {
    params: ["operations"],
    example: 'insert("apple"), search("apple") -> true, search("app") -> false, startsWith("app") -> true',
    difficulty: 'medium'
  },
  "Design Add And Search Words Data Structure": {
    params: ["operations"],
    example: 'addWord("bad"), addWord("dad"), search(".ad") -> true, search("b..") -> true',
    difficulty: 'medium'
  },
  "Word Search II": {
    params: ["board", "words"],
    example: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"] -> ["eat","oath"]',
    difficulty: 'hard'
  },

  // ── Heap / Priority Queue ──────────────────────────
  "Kth Largest Element In a Stream": {
    params: ["k", "nums"],
    example: "k = 3, nums = [4,5,8,2], add(3) -> 4, add(5) -> 5, add(10) -> 5, add(9) -> 8, add(4) -> 8",
    difficulty: 'easy'
  },
  "Last Stone Weight": {
    params: ["stones"],
    example: "stones = [2,7,4,1,8,1] -> 1",
    difficulty: 'easy'
  },
  "K Closest Points to Origin": {
    params: ["points", "k"],
    example: "points = [[1,3],[-2,2]], k = 1 -> [[-2,2]]",
    difficulty: 'medium'
  },
  "Kth Largest Element In An Array": {
    params: ["nums", "k"],
    example: "nums = [3,2,1,5,6,4], k = 2 -> 5",
    difficulty: 'medium'
  },
  "Task Scheduler": {
    params: ["tasks", "n"],
    example: 'tasks = ["A","A","A","B","B","B"], n = 2 -> 8',
    difficulty: 'medium'
  },
  "Design Twitter": {
    params: ["operations"],
    example: "postTweet(1,5), getNewsFeed(1) -> [5], follow(1,2), postTweet(2,6), getNewsFeed(1) -> [6,5]",
    difficulty: 'medium'
  },
  "Find Median From Data Stream": {
    params: ["operations"],
    example: "addNum(1), addNum(2), findMedian() -> 1.5, addNum(3), findMedian() -> 2.0",
    difficulty: 'hard'
  },

  // ── Backtracking ───────────────────────────────────
  "Subsets": {
    params: ["nums"],
    example: "nums = [1,2,3] -> [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
    difficulty: 'medium'
  },
  "Combination Sum": {
    params: ["candidates", "target"],
    example: "candidates = [2,3,6,7], target = 7 -> [[2,2,3],[7]]",
    difficulty: 'medium'
  },
  "Combination Sum II": {
    params: ["candidates", "target"],
    example: "candidates = [10,1,2,7,6,1,5], target = 8 -> [[1,1,6],[1,2,5],[1,7],[2,6]]",
    difficulty: 'medium'
  },
  "Permutations": {
    params: ["nums"],
    example: "nums = [1,2,3] -> [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
    difficulty: 'medium'
  },
  "Subsets II": {
    params: ["nums"],
    example: "nums = [1,2,2] -> [[],[1],[1,2],[1,2,2],[2],[2,2]]",
    difficulty: 'medium'
  },
  "Generate Parentheses": {
    params: ["n"],
    example: 'n = 3 -> ["((()))","(()())","(())()","()(())","()()()"]',
    difficulty: 'medium'
  },
  "Word Search": {
    params: ["board", "word"],
    example: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED" -> true',
    difficulty: 'medium'
  },
  "Palindrome Partitioning": {
    params: ["s"],
    example: 's = "aab" -> [["a","a","b"],["aa","b"]]',
    difficulty: 'medium'
  },
  "Letter Combinations of a Phone Number": {
    params: ["digits"],
    example: 'digits = "23" -> ["ad","ae","af","bd","be","bf","cd","ce","cf"]',
    difficulty: 'medium'
  },
  "N Queens": {
    params: ["n"],
    example: 'n = 4 -> [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
    difficulty: 'hard'
  },

  // ── Graphs ─────────────────────────────────────────
  "Number of Islands": {
    params: ["grid"],
    example: 'grid = [["1","1","0","0"],["1","1","0","0"],["0","0","1","0"],["0","0","0","1"]] -> 3',
    difficulty: 'medium'
  },
  "Max Area of Island": {
    params: ["grid"],
    example: "grid = [[0,0,1,0,0],[0,1,1,0,0],[0,0,0,1,1]] -> 3",
    difficulty: 'medium'
  },
  "Clone Graph": {
    params: ["node"],
    example: "adjList = [[2,4],[1,3],[2,4],[1,3]] -> deep copy of graph",
    difficulty: 'medium'
  },
  "Walls And Gates": {
    params: ["rooms"],
    example: "rooms = [[INF,-1,0,INF],[INF,INF,INF,-1],[INF,-1,INF,-1],[0,-1,INF,INF]] -> [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]",
    difficulty: 'medium'
  },
  "Rotting Oranges": {
    params: ["grid"],
    example: "grid = [[2,1,1],[1,1,0],[0,1,1]] -> 4",
    difficulty: 'medium'
  },
  "Pacific Atlantic Water Flow": {
    params: ["heights"],
    example: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]] -> [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]",
    difficulty: 'medium'
  },
  "Surrounded Regions": {
    params: ["board"],
    example: 'board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]] -> [["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]',
    difficulty: 'medium'
  },
  "Course Schedule": {
    params: ["numCourses", "prerequisites"],
    example: "numCourses = 2, prerequisites = [[1,0]] -> true",
    difficulty: 'medium'
  },
  "Course Schedule II": {
    params: ["numCourses", "prerequisites"],
    example: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]] -> [0,2,1,3]",
    difficulty: 'medium'
  },
  "Graph Valid Tree": {
    params: ["n", "edges"],
    example: "n = 5, edges = [[0,1],[0,2],[0,3],[1,4]] -> true",
    difficulty: 'medium'
  },
  "Number of Connected Components In An Undirected Graph": {
    params: ["n", "edges"],
    example: "n = 5, edges = [[0,1],[1,2],[3,4]] -> 2",
    difficulty: 'medium'
  },
  "Redundant Connection": {
    params: ["edges"],
    example: "edges = [[1,2],[1,3],[2,3]] -> [2,3]",
    difficulty: 'medium'
  },
  "Word Ladder": {
    params: ["beginWord", "endWord", "wordList"],
    example: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"] -> 5',
    difficulty: 'hard'
  },

  // ── 1-D Dynamic Programming ────────────────────────
  "Climbing Stairs": {
    params: ["n"],
    example: "n = 5 -> 8",
    difficulty: 'easy'
  },
  "Min Cost Climbing Stairs": {
    params: ["cost"],
    example: "cost = [10,15,20] -> 15",
    difficulty: 'easy'
  },
  "House Robber": {
    params: ["nums"],
    example: "nums = [2,7,9,3,1] -> 12",
    difficulty: 'medium'
  },
  "House Robber II": {
    params: ["nums"],
    example: "nums = [2,3,2] -> 3",
    difficulty: 'medium'
  },
  "Longest Palindromic Substring": {
    params: ["s"],
    example: 's = "babad" -> "bab"',
    difficulty: 'medium'
  },
  "Palindromic Substrings": {
    params: ["s"],
    example: 's = "abc" -> 3',
    difficulty: 'medium'
  },
  "Decode Ways": {
    params: ["s"],
    example: 's = "226" -> 3',
    difficulty: 'medium'
  },
  "Coin Change": {
    params: ["coins", "amount"],
    example: "coins = [1,5,10,25], amount = 36 -> 3",
    difficulty: 'medium'
  },
  "Maximum Product Subarray": {
    params: ["nums"],
    example: "nums = [2,3,-2,4] -> 6",
    difficulty: 'medium'
  },
  "Word Break": {
    params: ["s", "wordDict"],
    example: 's = "leetcode", wordDict = ["leet","code"] -> true',
    difficulty: 'medium'
  },
  "Longest Increasing Subsequence": {
    params: ["nums"],
    example: "nums = [10,9,2,5,3,7,101,18] -> 4",
    difficulty: 'medium'
  },
  "Partition Equal Subset Sum": {
    params: ["nums"],
    example: "nums = [1,5,11,5] -> true",
    difficulty: 'medium'
  },

  // ── Intervals ──────────────────────────────────────
  "Insert Interval": {
    params: ["intervals", "newInterval"],
    example: "intervals = [[1,3],[6,9]], newInterval = [2,5] -> [[1,5],[6,9]]",
    difficulty: 'medium'
  },
  "Merge Intervals": {
    params: ["intervals"],
    example: "intervals = [[1,3],[2,6],[8,10],[15,18]] -> [[1,6],[8,10],[15,18]]",
    difficulty: 'medium'
  },
  "Non Overlapping Intervals": {
    params: ["intervals"],
    example: "intervals = [[1,2],[2,3],[3,4],[1,3]] -> 1",
    difficulty: 'medium'
  },
  "Meeting Rooms": {
    params: ["intervals"],
    example: "intervals = [[0,30],[5,10],[15,20]] -> false",
    difficulty: 'easy'
  },
  "Meeting Rooms II": {
    params: ["intervals"],
    example: "intervals = [[0,30],[5,10],[15,20]] -> 2",
    difficulty: 'medium'
  },
  "Minimum Interval to Include Each Query": {
    params: ["intervals", "queries"],
    example: "intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5] -> [3,3,1,4]",
    difficulty: 'hard'
  },

  // ── Greedy ─────────────────────────────────────────
  "Maximum Subarray": {
    params: ["nums"],
    example: "nums = [-2,1,-3,4,-1,2,1,-5,4] -> 6",
    difficulty: 'medium'
  },
  "Jump Game": {
    params: ["nums"],
    example: "nums = [2,3,1,1,4] -> true",
    difficulty: 'medium'
  },
  "Jump Game II": {
    params: ["nums"],
    example: "nums = [2,3,1,1,4] -> 2",
    difficulty: 'medium'
  },
  "Gas Station": {
    params: ["gas", "cost"],
    example: "gas = [1,2,3,4,5], cost = [3,4,5,1,2] -> 3",
    difficulty: 'medium'
  },
  "Hand of Straights": {
    params: ["hand", "groupSize"],
    example: "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3 -> true",
    difficulty: 'medium'
  },
  "Merge Triplets to Form Target Triplet": {
    params: ["triplets", "target"],
    example: "triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5] -> true",
    difficulty: 'medium'
  },
  "Partition Labels": {
    params: ["s"],
    example: 's = "ababcbacadefegdehijhklij" -> [9,7,8]',
    difficulty: 'medium'
  },
  "Valid Parenthesis String": {
    params: ["s"],
    example: 's = "(*)" -> true',
    difficulty: 'medium'
  },

  // ── Advanced Graphs ────────────────────────────────
  "Network Delay Time": {
    params: ["times", "n", "k"],
    example: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2 -> 2",
    difficulty: 'medium'
  },
  "Reconstruct Itinerary": {
    params: ["tickets"],
    example: 'tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]] -> ["JFK","MUC","LHR","SFO","SJC"]',
    difficulty: 'hard'
  },
  "Min Cost to Connect All Points": {
    params: ["points"],
    example: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]] -> 20",
    difficulty: 'medium'
  },
  "Swim In Rising Water": {
    params: ["grid"],
    example: "grid = [[0,2],[1,3]] -> 3",
    difficulty: 'hard'
  },
  "Alien Dictionary": {
    params: ["words"],
    example: 'words = ["wrt","wrf","er","ett","rftt"] -> "wertf"',
    difficulty: 'hard'
  },
  "Cheapest Flights Within K Stops": {
    params: ["n", "flights", "src", "dst", "k"],
    example: "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1 -> 700",
    difficulty: 'medium'
  },

  // ── 2-D Dynamic Programming ────────────────────────
  "Unique Paths": {
    params: ["m", "n"],
    example: "m = 3, n = 7 -> 28",
    difficulty: 'medium'
  },
  "Longest Common Subsequence": {
    params: ["text1", "text2"],
    example: 'text1 = "abcde", text2 = "ace" -> 3',
    difficulty: 'medium'
  },
  "Best Time to Buy And Sell Stock With Cooldown": {
    params: ["prices"],
    example: "prices = [1,2,3,0,2] -> 3",
    difficulty: 'medium'
  },
  "Coin Change II": {
    params: ["amount", "coins"],
    example: "amount = 5, coins = [1,2,5] -> 4",
    difficulty: 'medium'
  },
  "Target Sum": {
    params: ["nums", "target"],
    example: "nums = [1,1,1,1,1], target = 3 -> 5",
    difficulty: 'medium'
  },
  "Interleaving String": {
    params: ["s1", "s2", "s3"],
    example: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac" -> true',
    difficulty: 'hard'
  },
  "Longest Increasing Path In a Matrix": {
    params: ["matrix"],
    example: "matrix = [[9,9,4],[6,6,8],[2,1,1]] -> 4",
    difficulty: 'hard'
  },
  "Distinct Subsequences": {
    params: ["s", "t"],
    example: 's = "rabbbit", t = "rabbit" -> 3',
    difficulty: 'hard'
  },
  "Edit Distance": {
    params: ["word1", "word2"],
    example: 'word1 = "horse", word2 = "ros" -> 3',
    difficulty: 'hard'
  },
  "Burst Balloons": {
    params: ["nums"],
    example: "nums = [3,1,5,8] -> 167",
    difficulty: 'hard'
  },
  "Regular Expression Matching": {
    params: ["s", "p"],
    example: 's = "aa", p = "a*" -> true',
    difficulty: 'hard'
  },

  // ── Bit Manipulation ───────────────────────────────
  "Single Number": {
    params: ["nums"],
    example: "nums = [4,1,2,1,2] -> 4",
    difficulty: 'easy'
  },
  "Number of 1 Bits": {
    params: ["n"],
    example: "n = 11 (0b1011) -> 3",
    difficulty: 'easy'
  },
  "Counting Bits": {
    params: ["n"],
    example: "n = 5 -> [0,1,1,2,1,2]",
    difficulty: 'easy'
  },
  "Reverse Bits": {
    params: ["n"],
    example: "n = 43261596 (0b00000010100101000001111010011100) -> 964176192",
    difficulty: 'easy'
  },
  "Missing Number": {
    params: ["nums"],
    example: "nums = [3,0,1] -> 2",
    difficulty: 'easy'
  },
  "Sum of Two Integers": {
    params: ["a", "b"],
    example: "a = 1, b = 2 -> 3",
    difficulty: 'medium'
  },
  "Reverse Integer": {
    params: ["x"],
    example: "x = 123 -> 321",
    difficulty: 'medium'
  },

  // ── Math & Geometry ────────────────────────────────
  "Rotate Image": {
    params: ["matrix"],
    example: "matrix = [[1,2,3],[4,5,6],[7,8,9]] -> [[7,4,1],[8,5,2],[9,6,3]]",
    difficulty: 'medium'
  },
  "Spiral Matrix": {
    params: ["matrix"],
    example: "matrix = [[1,2,3],[4,5,6],[7,8,9]] -> [1,2,3,6,9,8,7,4,5]",
    difficulty: 'medium'
  },
  "Set Matrix Zeroes": {
    params: ["matrix"],
    example: "matrix = [[1,1,1],[1,0,1],[1,1,1]] -> [[1,0,1],[0,0,0],[1,0,1]]",
    difficulty: 'medium'
  },
  "Happy Number": {
    params: ["n"],
    example: "n = 19 -> true  (1² + 9² = 82, 8² + 2² = 68, ... -> 1)",
    difficulty: 'easy'
  },
  "Plus One": {
    params: ["digits"],
    example: "digits = [1,2,3] -> [1,2,4]",
    difficulty: 'easy'
  },
  "Pow(x, n)": {
    params: ["x", "n"],
    example: "x = 2.00000, n = 10 -> 1024.00000",
    difficulty: 'medium'
  },
  "Multiply Strings": {
    params: ["num1", "num2"],
    example: 'num1 = "123", num2 = "456" -> "56088"',
    difficulty: 'medium'
  },
  "Detect Squares": {
    params: ["operations"],
    example: "add([3,10]), add([11,2]), add([3,2]), count([11,10]) -> 1",
    difficulty: 'medium'
  }
};

// ======================================================
// AI PROVIDERS
// ======================================================

export const AI_PROVIDERS = [
  {
    id: 'mistral',
    name: 'Mistral',
    models: [
      'mistral-large-latest',
      'mistral-small-latest',
      'codestral-latest'
    ]
  },

  {
    id: 'gemini',
    name: 'Gemini',
    models: [
      'gemini-3.1-pro-preview',
      'gemini-3-flash-preview'
    ]
  },

  {
    id: 'groq',
    name: 'Groq',
    models: [
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768'
    ]
  },

  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-7b:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free'
    ]
  }
];

// ======================================================
// STARTER CODE
// ======================================================

export const getStarterCode = (
  problem: string,
  lang: Language
): string => {

  const info = PROBLEM_INFO[problem] || {
    params: ["nums"]
  };

  const safeName = problem.replace(/[^a-zA-Z0-9]/g, '');

  const camelCase =
    safeName.charAt(0).toLowerCase() + safeName.slice(1);

  const snake_case = safeName
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');

  const jsParams = info.params.join(', ');
  const pyParams = info.params.join(', ');
  const javaParams = info.params
    .map(p => `Object ${p}`)
    .join(', ');

  const cppParams = info.params
    .map(p => `auto ${p}`)
    .join(', ');

  const exampleComment = info.example
    ? `\n * Example: ${info.example}`
    : '';

  const pyExampleComment = info.example
    ? `\n        # Example: ${info.example}`
    : '';

  switch (lang) {

    case 'python':
      return `class Solution:
    def ${snake_case}(self, ${pyParams}):${pyExampleComment}
        # Write your code here
        pass`;

    case 'javascript': {

      let testCall =
        `// console.log(${camelCase}(/* args */));`;

      if (info.example) {

        const argsPart =
          info.example.split('->')[0].trim();

        const values = argsPart
          .split(',')
          .map(s => {
            const parts = s.split('=');
            return parts.length > 1
              ? parts[1].trim()
              : s.trim();
          })
          .join(', ');

        testCall =
          `// console.log(${camelCase}(${values}));`;
      }

      return `/**
 * Mission: ${problem}${exampleComment}
 */
var ${camelCase} = function(${jsParams}) {
    // Write your code here
};

// Test your code:
${testCall}`;
    }

    case 'java':
      return `class Solution {
    public Object ${camelCase}(${javaParams}) {
        // Write your code here
        return null;
    }
}`;

    case 'cpp':
      return `class Solution {
public:
    auto ${camelCase}(${cppParams}) {
        // Write your code here
    }
};`;

    default:
      return '// Write your code here';
  }
};