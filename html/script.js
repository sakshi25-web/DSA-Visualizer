/* ==========================================================================
   DSA VISUALIZER — APPLICATION LOGIC
   Vanilla ES6+ JavaScript. Clean architecture:
   - Utils: Common helper functions
   - ALGORITHM_METADATA: Complexities, pseudocode, pros/cons, applications
   - StatsManager: Precise, reversible stats snapshot tracking
   - PseudocodeManager: Step-by-step code highlighting
   - Logger: Real-time execution log
   - InfoPanelManager: Educational info display
   - AnimationEngine: Frame-based deterministic playback engine
   - Renderers: DOM & SVG visualizers for Arrays, Trees, Graphs, Tables, Grids, etc.
   - Algorithm Modules: Pure state machine generators producing frames
   - DSAVisualizerApp: UI orchestrator wiring controls, navigation, and state
   ========================================================================== */

(() => {
  "use strict";

  /* ========================================================================
     1. UTILITIES
     ======================================================================== */
  const Utils = {
    $(selector, root = document) {
      return root.querySelector(selector);
    },
    $all(selector, root = document) {
      return Array.from(root.querySelectorAll(selector));
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    randomArray(size = 15, min = 5, max = 100) {
      return Array.from({ length: size }, () => Utils.randomInt(min, max));
    },
    parseCustomArray(text) {
      if (!text || typeof text !== "string" || !text.trim()) return null;
      const clean = text.replace(/[[\]]/g, " ").trim();
      const parts = clean.split(/[,\s]+/).filter((v) => v.length > 0);
      if (!parts.length) return null;
      const nums = parts.map(Number);
      if (nums.some((v) => Number.isNaN(v))) return null;
      return nums;
    },
    formatTime(ms) {
      return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
    },
    debounce(fn, wait = 200) {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
      };
    },
    downloadJSON(data, filename = "dsa-visualizer-state.json") {
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
      }
    },
    readJSONFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(JSON.parse(reader.result));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },
    createEl(tag, className, text) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined && text !== null) el.textContent = text;
      return el;
    },
  };

  /* ========================================================================
     2. ALGORITHM METADATA
     ======================================================================== */
  const ALGORITHM_METADATA = {
    // --- Sorting ---
    "sort-bubble": {
      title: "Bubble Sort",
      description: "Repeatedly steps through the array, compares adjacent elements and swaps them if they are in the wrong order.",
      complexity: { time: "O(n\u00B2)", space: "O(1)", best: "O(n)", average: "O(n\u00B2)", worst: "O(n\u00B2)" },
      advantages: ["Simple to understand and implement", "In-place sorting with O(1) extra memory", "Stable sort"],
      disadvantages: ["Very slow on large datasets", "Performs many redundant comparisons"],
      applications: ["Teaching fundamental sorting concepts", "Small or nearly sorted arrays"],
      pseudocode: [
        "for i in 0 to n-1:",
        "  for j in 0 to n-i-2:",
        "    if arr[j] > arr[j+1]:",
        "      swap(arr[j], arr[j+1])",
        "return arr",
      ],
    },
    "sort-selection": {
      title: "Selection Sort",
      description: "Finds the minimum element from the unsorted region and places it at the beginning, repeating for all items.",
      complexity: { time: "O(n\u00B2)", space: "O(1)", best: "O(n\u00B2)", average: "O(n\u00B2)", worst: "O(n\u00B2)" },
      advantages: ["Performs at most O(n) swaps", "In-place with O(1) auxiliary space"],
      disadvantages: ["Always runs in O(n\u00B2) comparisons regardless of input", "Not stable in standard form"],
      applications: ["When write/swap operations are costly", "Small arrays with memory limits"],
      pseudocode: [
        "for i in 0 to n-1:",
        "  min_idx = i",
        "  for j in i+1 to n-1:",
        "    if arr[j] < arr[min_idx]: min_idx = j",
        "  swap(arr[i], arr[min_idx])",
      ],
    },
    "sort-insertion": {
      title: "Insertion Sort",
      description: "Iteratively builds a sorted prefix by picking the next element and shifting larger elements to the right.",
      complexity: { time: "O(n\u00B2)", space: "O(1)", best: "O(n)", average: "O(n\u00B2)", worst: "O(n\u00B2)" },
      advantages: ["Very efficient for small or nearly sorted arrays", "Adaptive and stable", "In-place"],
      disadvantages: ["Quadratic worst/average time on large random data"],
      applications: ["Hybrid sorting routines (Timsort, IntroSort)", "Online streaming data"],
      pseudocode: [
        "for i in 1 to n-1:",
        "  key = arr[i]; j = i - 1",
        "  while j >= 0 and arr[j] > key:",
        "    arr[j+1] = arr[j]; j = j - 1",
        "  arr[j+1] = key",
      ],
    },
    "sort-merge": {
      title: "Merge Sort",
      description: "Divide-and-conquer algorithm that recursively divides the array in half, sorts halves, and merges them.",
      complexity: { time: "O(n log n)", space: "O(n)", best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
      advantages: ["Guaranteed O(n log n) worst-case time", "Stable sort", "Great for linked lists"],
      disadvantages: ["Requires O(n) auxiliary memory", "Slower on small arrays than insertion sort"],
      applications: ["External sorting on large files", "Standard libraries (Java, Python Timsort base)"],
      pseudocode: [
        "mergeSort(arr, l, r):",
        "  if l >= r: return",
        "  mid = floor((l + r) / 2)",
        "  mergeSort(arr, l, mid)",
        "  mergeSort(arr, mid+1, r)",
        "  merge(arr, l, mid, r)",
      ],
    },
    "sort-quick": {
      title: "Quick Sort",
      description: "Picks a pivot element, partitions the array around it, and recursively sorts left and right sub-arrays.",
      complexity: { time: "O(n log n)", space: "O(log n)", best: "O(n log n)", average: "O(n log n)", worst: "O(n\u00B2)" },
      advantages: ["Extremely fast in practice with great cache locality", "In-place sorting"],
      disadvantages: ["O(n\u00B2) worst case on poor pivot choice", "Not stable"],
      applications: ["General-purpose systems sort (C++ std::sort, qsort)", "Numeric arrays"],
      pseudocode: [
        "quickSort(arr, lo, hi):",
        "  if lo >= hi: return",
        "  p = partition(arr, lo, hi)",
        "  quickSort(arr, lo, p - 1)",
        "  quickSort(arr, p + 1, hi)",
      ],
    },
    "sort-heap": {
      title: "Heap Sort",
      description: "Transforms the array into a max-heap, then repeatedly extracts the root maximum to build the sorted array.",
      complexity: { time: "O(n log n)", space: "O(1)", best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
      advantages: ["Guaranteed O(n log n) time in-place with O(1) space", "No recursion stack overhead"],
      disadvantages: ["Poor cache locality due to jumpy heap indices", "Not stable"],
      applications: ["Embedded and real-time systems needing strict guarantees", "Priority queues"],
      pseudocode: [
        "buildMaxHeap(arr, n)",
        "for i in n-1 down to 1:",
        "  swap(arr[0], arr[i])",
        "  heapify(arr, i, 0)",
      ],
    },
    "sort-shell": {
      title: "Shell Sort",
      description: "An optimization of insertion sort that compares and shifts elements separated by diminishing gaps.",
      complexity: { time: "O(n log\u00B2 n)", space: "O(1)", best: "O(n log n)", average: "O(n^1.3)", worst: "O(n\u00B2)" },
      advantages: ["Much faster than simple insertion sort", "In-place and simple to code"],
      disadvantages: ["Performance depends on the gap sequence", "Not stable"],
      applications: ["Embedded hardware", "Medium-sized datasets"],
      pseudocode: [
        "gap = floor(n / 2)",
        "while gap > 0:",
        "  for i in gap to n-1:",
        "    temp = arr[i]; j = i",
        "    while j >= gap and arr[j - gap] > temp:",
        "      arr[j] = arr[j - gap]; j -= gap",
        "    arr[j] = temp",
        "  gap = floor(gap / 2)",
      ],
    },
    "sort-counting": {
      title: "Counting Sort",
      description: "Non-comparison sorting algorithm that counts frequencies of distinct values and computes prefix sums.",
      complexity: { time: "O(n + k)", space: "O(k)", best: "O(n + k)", average: "O(n + k)", worst: "O(n + k)" },
      advantages: ["Linear time when range k is small", "Stable sorting"],
      disadvantages: ["Requires integer keys", "High memory overhead when range k is very large"],
      applications: ["Subroutine in Radix Sort", "Sorting test scores, ages, or categorical data"],
      pseudocode: [
        "count = array of size (max - min + 1) filled with 0",
        "for x in arr: count[x - min]++",
        "for i in 1 to count.length - 1: count[i] += count[i - 1]",
        "for i in n-1 down to 0:",
        "  output[--count[arr[i] - min]] = arr[i]",
        "return output",
      ],
    },
    "sort-radix": {
      title: "Radix Sort",
      description: "Sorts integers digit by digit, from least significant digit (LSD) to most significant digit (MSD).",
      complexity: { time: "O(d \u00B7 (n + k))", space: "O(n + k)", best: "O(d \u00B7 n)", average: "O(d \u00B7 n)", worst: "O(d \u00B7 n)" },
      advantages: ["Linear time for fixed-length integer keys", "Stable"],
      disadvantages: ["Not in-place", "Key width d can add overhead"],
      applications: ["Sorting integers, IP addresses, fixed-length strings", "Suffix array construction"],
      pseudocode: [
        "for exp in 1, 10, 100... up to max_val:",
        "  countingSortByDigit(arr, exp)",
      ],
    },

    // --- Searching ---
    "search-linear": {
      title: "Linear Search",
      description: "Sequentially checks each element of the array from left to right until the target value is found.",
      complexity: { time: "O(n)", space: "O(1)", best: "O(1)", average: "O(n)", worst: "O(n)" },
      advantages: ["Works on unsorted arrays", "Requires no extra memory or preprocessing"],
      disadvantages: ["Slow on large datasets"],
      applications: ["Unsorted lists", "Small arrays (< 30 items)"],
      pseudocode: [
        "for i in 0 to n-1:",
        "  if arr[i] == target: return i",
        "return -1",
      ],
    },
    "search-binary": {
      title: "Binary Search",
      description: "Repeatedly halves the search interval of a sorted array by comparing the target to the middle element.",
      complexity: { time: "O(log n)", space: "O(1)", best: "O(1)", average: "O(log n)", worst: "O(log n)" },
      advantages: ["Logarithmic time lookup", "Minimal comparisons"],
      disadvantages: ["Requires sorted input array"],
      applications: ["Dictionary lookup", "Database indexing", "B-Trees"],
      pseudocode: [
        "lo = 0; hi = n - 1",
        "while lo <= hi:",
        "  mid = floor((lo + hi) / 2)",
        "  if arr[mid] == target: return mid",
        "  else if arr[mid] < target: lo = mid + 1",
        "  else: hi = mid - 1",
        "return -1",
      ],
    },
    "search-jump": {
      title: "Jump Search",
      description: "Jumps ahead by fixed blocks of size \u221An in a sorted array, then does a linear search within the block.",
      complexity: { time: "O(\u221An)", space: "O(1)", best: "O(1)", average: "O(\u221An)", worst: "O(\u221An)" },
      advantages: ["Faster than linear search", "Only jumps in a forward direction (good for slow backward seeks)"],
      disadvantages: ["Requires sorted data", "Slower than binary search"],
      applications: ["Searching on medium sorted datasets", "Hardware where jumping backward is costly"],
      pseudocode: [
        "step = floor(sqrt(n)); prev = 0",
        "while arr[min(step, n) - 1] < target:",
        "  prev = step; step += floor(sqrt(n))",
        "  if prev >= n: return -1",
        "for i in prev to min(step, n) - 1:",
        "  if arr[i] == target: return i",
        "return -1",
      ],
    },
    "search-interpolation": {
      title: "Interpolation Search",
      description: "Estimates the probable position of the target using a linear interpolation formula on uniformly distributed sorted data.",
      complexity: { time: "O(log log n)", space: "O(1)", best: "O(1)", average: "O(log log n)", worst: "O(n)" },
      advantages: ["Extremely fast (O(log log n)) on uniform sorted data"],
      disadvantages: ["Degrades to O(n) on skewed or non-uniform data", "Requires arithmetic on keys"],
      applications: ["Telephone directories", "Uniform numeric tables"],
      pseudocode: [
        "while lo <= hi and target >= arr[lo] and target <= arr[hi]:",
        "  pos = lo + floor(((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]))",
        "  if arr[pos] == target: return pos",
        "  if arr[pos] < target: lo = pos + 1",
        "  else: hi = pos - 1",
        "return -1",
      ],
    },

    // --- Linear Structures ---
    "linear-stack": {
      title: "Stack (LIFO)",
      description: "Last-In, First-Out (LIFO) linear data structure where additions and removals happen at the top.",
      complexity: { time: "O(1) Push/Pop", space: "O(n)", best: "O(1)", average: "O(1)", worst: "O(1)" },
      advantages: ["Instant O(1) push and pop", "Simple and predictable"],
      disadvantages: ["No random access to elements"],
      applications: ["Function call stacks", "Undo/Redo buffers", "Expression parsing", "DFS"],
      pseudocode: [
        "push(x): top++; stack[top] = x",
        "pop(): x = stack[top]; top--; return x",
        "peek(): return stack[top]",
      ],
    },
    "linear-queue": {
      title: "Queue (FIFO)",
      description: "First-In, First-Out (FIFO) linear data structure where elements enter at the rear and leave from the front.",
      complexity: { time: "O(1) Enqueue/Dequeue", space: "O(n)", best: "O(1)", average: "O(1)", worst: "O(1)" },
      advantages: ["Fair ordering (FIFO)", "O(1) enqueue and dequeue"],
      disadvantages: ["No random access to middle elements"],
      applications: ["Task scheduling", "Breadth-First Search (BFS)", "Print spooling"],
      pseudocode: [
        "enqueue(x): queue[tail++] = x",
        "dequeue(): return queue[head++]",
      ],
    },
    "linked-list": {
      title: "Linked List",
      description: "A sequence of data nodes where each node points to the next (and optionally previous in doubly linked lists).",
      complexity: { time: "O(1) Insert/Delete at head, O(n) Access", space: "O(n)", best: "O(1)", average: "O(n)", worst: "O(n)" },
      advantages: ["Dynamic size with O(1) head/tail insertions", "No memory reallocation needed"],
      disadvantages: ["O(n) sequential access (no indexing)", "Pointer memory overhead"],
      applications: ["Implementing Stacks and Queues", "Symbol tables in compilers", "Music playlists"],
      pseudocode: [
        "insertHead(val): node = new Node(val); node.next = head; head = node",
        "deleteAt(idx): traverse to idx-1, link around target node",
      ],
    },
    "hashing": {
      title: "Hash Table (Chaining)",
      description: "Key-value associative store that hashes keys to bucket indices and resolves collisions using chained lists.",
      complexity: { time: "O(1) avg Insert/Search/Delete", space: "O(n)", best: "O(1)", average: "O(1)", worst: "O(n)" },
      advantages: ["Average constant time O(1) lookups and insertions", "Dynamic key support"],
      disadvantages: ["Worst-case O(n) on heavy hash collisions", "Unordered iteration"],
      applications: ["Dictionaries and Maps", "Database indexing", "Caching"],
      pseudocode: [
        "index = hash(key) % capacity",
        "buckets[index].append({key, value})",
      ],
    },

    // --- Trees ---
    "tree-bst": {
      title: "Binary Search Tree (BST)",
      description: "Binary tree where every node's left subtree contains smaller values, and right subtree contains larger values.",
      complexity: { time: "O(log n) avg, O(n) worst", space: "O(n)", best: "O(log n)", average: "O(log n)", worst: "O(n)" },
      advantages: ["Maintains sorted order dynamically", "Fast search and range queries"],
      disadvantages: ["Can degenerate into a linked list of height O(n) if unbalanced"],
      applications: ["Dynamic sorted sets", "Syntax trees", "Hierarchical data modeling"],
      pseudocode: [
        "insert(node, val):",
        "  if node == null: return new Node(val)",
        "  if val < node.val: node.left = insert(node.left, val)",
        "  else: node.right = insert(node.right, val)",
        "  return node",
      ],
    },
    "tree-avl": {
      title: "AVL Tree (Self-Balancing BST)",
      description: "Strictly balanced BST where the heights of the two child subtrees of any node differ by at most one.",
      complexity: { time: "O(log n) guaranteed", space: "O(n)", best: "O(log n)", average: "O(log n)", worst: "O(log n)" },
      advantages: ["Guaranteed O(log n) search, insertion, and deletion", "No worst-case degeneration"],
      disadvantages: ["Extra balance factor storage", "Frequent rotation overhead during updates"],
      applications: ["High-performance lookup databases", "Memory-intensive search trees"],
      pseudocode: [
        "balance = height(left) - height(right)",
        "if balance > 1 and val < node.left.val: rotateRight(node)",
        "if balance < -1 and val > node.right.val: rotateLeft(node)",
        "if balance > 1 and val > node.left.val: node.left = rotateLeft(node.left); rotateRight(node)",
        "if balance < -1 and val < node.right.val: node.right = rotateRight(node.right); rotateLeft(node)",
      ],
    },
    "heap": {
      title: "Binary Heap",
      description: "Complete binary tree satisfying the heap property (parent is always >= children for Max-Heap, or <= for Min-Heap).",
      complexity: { time: "O(1) Find-Max, O(log n) Insert/Extract", space: "O(n)", best: "O(1)", average: "O(log n)", worst: "O(log n)" },
      advantages: ["Efficient priority queue operations", "Compact array representation with zero pointer overhead"],
      disadvantages: ["O(n) search for arbitrary non-root elements"],
      applications: ["Priority Queues", "Dijkstra's & Prim's algorithms", "Heap Sort"],
      pseudocode: [
        "insert(x): append x to array; siftUp(last_index)",
        "extractMax(): max = arr[0]; arr[0] = arr.pop(); siftDown(0); return max",
      ],
    },
    "trie": {
      title: "Trie (Prefix Tree)",
      description: "Tree data structure used to store a dynamic set or associative array where keys are usually strings.",
      complexity: { time: "O(L) where L is key length", space: "O(\u03A3 \u00B7 L \u00B7 N)", best: "O(L)", average: "O(L)", worst: "O(L)" },
      advantages: ["Fast prefix-based lookup and auto-completion", "No hash collision issues"],
      disadvantages: ["Can require substantial memory if many sparsely shared prefixes"],
      applications: ["Autocomplete systems", "Spell checkers", "IP routing lookup"],
      pseudocode: [
        "insert(word):",
        "  curr = root",
        "  for ch in word:",
        "    if not curr.children.has(ch): curr.children.set(ch, new Node())",
        "    curr = curr.children.get(ch)",
        "  curr.isEnd = true",
      ],
    },

    // --- Graphs ---
    "graph-bfs": {
      title: "Breadth-First Search (BFS)",
      description: "Traverses graph level by level using a queue, exploring all immediate neighbors before moving deeper.",
      complexity: { time: "O(V + E)", space: "O(V)", best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
      advantages: ["Guarantees shortest path in unweighted graphs", "Finds all reachable vertices in layers"],
      disadvantages: ["Requires O(V) queue memory to store frontier vertices"],
      applications: ["Shortest path in unweighted graphs", "Peer-to-peer networks", "Web crawlers"],
      pseudocode: [
        "queue.push(start); visited.add(start)",
        "while queue is not empty:",
        "  curr = queue.pop()",
        "  for neighbor in adj[curr]:",
        "    if neighbor not in visited:",
        "      visited.add(neighbor); queue.push(neighbor)",
      ],
    },
    "graph-dfs": {
      title: "Depth-First Search (DFS)",
      description: "Explores as far as possible along each branch before backtracking, using recursion or a stack.",
      complexity: { time: "O(V + E)", space: "O(V)", best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
      advantages: ["Low memory when solutions are deep", "Natural for cycle detection and connectivity"],
      disadvantages: ["Does not find shortest paths", "May get trapped in deep branches without pruning"],
      applications: ["Topological sorting", "Connected components", "Solving mazes and puzzles"],
      pseudocode: [
        "dfs(u):",
        "  visited.add(u)",
        "  for v in adj[u]:",
        "    if v not in visited: dfs(v)",
      ],
    },
    "graph-dijkstra": {
      title: "Dijkstra's Shortest Path",
      description: "Greedy algorithm that finds the shortest path from a starting vertex to all other vertices in a non-negative weighted graph.",
      complexity: { time: "O((V + E) log V)", space: "O(V)", best: "O((V + E) log V)", average: "O((V + E) log V)", worst: "O((V + E) log V)" },
      advantages: ["Optimal and efficient for non-negative weights", "Widely adopted in routing"],
      disadvantages: ["Fails on graphs with negative edge weights"],
      applications: ["GPS navigation & Google Maps", "Network routing protocols (OSPF, IS-IS)"],
      pseudocode: [
        "dist[start] = 0; pq.push({start, 0})",
        "while pq is not empty:",
        "  {u, d} = pq.pop()",
        "  if d > dist[u]: continue",
        "  for {v, weight} in adj[u]:",
        "    if dist[u] + weight < dist[v]:",
        "      dist[v] = dist[u] + weight; pq.push({v, dist[v]})",
      ],
    },
    "graph-bellmanford": {
      title: "Bellman-Ford Algorithm",
      description: "Computes shortest paths from a single source vertex to all other vertices, supporting negative edge weights and detecting negative cycles.",
      complexity: { time: "O(V \u00B7 E)", space: "O(V)", best: "O(E)", average: "O(V \u00B7 E)", worst: "O(V \u00B7 E)" },
      advantages: ["Handles negative edge weights", "Detects reachable negative weight cycles"],
      disadvantages: ["Slower than Dijkstra on non-negative graphs"],
      applications: ["Routing Information Protocol (RIP)", "Financial arbitrage detection"],
      pseudocode: [
        "dist[start] = 0",
        "for i in 1 to V - 1:",
        "  for each edge (u, v, w):",
        "    if dist[u] + w < dist[v]: dist[v] = dist[u] + w",
      ],
    },
    "graph-floydwarshall": {
      title: "Floyd-Warshall Algorithm",
      description: "Dynamic programming algorithm to find shortest paths between all pairs of vertices in a weighted graph.",
      complexity: { time: "O(V\u00B3)", space: "O(V\u00B2)", best: "O(V\u00B3)", average: "O(V\u00B3)", worst: "O(V\u00B3)" },
      advantages: ["Finds all-pairs shortest paths in a single pass", "Simple 3-level nested loop"],
      disadvantages: ["O(V\u00B3) runtime is prohibitive on large sparse graphs"],
      applications: ["Transitive closure of graphs", "All-pairs transit routing tables"],
      pseudocode: [
        "for k from 0 to V-1:",
        "  for i from 0 to V-1:",
        "    for j from 0 to V-1:",
        "      dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])",
      ],
    },
    "graph-prim": {
      title: "Prim's Algorithm (MST)",
      description: "Greedy algorithm that finds a Minimum Spanning Tree for a connected weighted undirected graph by growing from a single vertex.",
      complexity: { time: "O(E log V)", space: "O(V)", best: "O(E log V)", average: "O(E log V)", worst: "O(E log V)" },
      advantages: ["Very fast on dense graphs with priority queue"],
      disadvantages: ["Requires a connected graph"],
      applications: ["Cable network design", "Water supply pipeline layouts", "LAN cabling"],
      pseudocode: [
        "inMST.add(start)",
        "while inMST.size < V:",
        "  pick minimum weight edge (u, v) where u in inMST, v not in inMST",
        "  inMST.add(v); add edge (u, v) to MST",
      ],
    },
    "graph-kruskal": {
      title: "Kruskal's Algorithm (MST)",
      description: "Greedy algorithm that finds a Minimum Spanning Tree by sorting all edges and adding them if they do not create a cycle (using Disjoint Set Union).",
      complexity: { time: "O(E log E)", space: "O(V)", best: "O(E log E)", average: "O(E log E)", worst: "O(E log E)" },
      advantages: ["Simple edge-based approach", "Optimal for sparse graphs"],
      disadvantages: ["Requires sorting all edges up front"],
      applications: ["Network routing", "Image segmentation", "Clustering algorithms"],
      pseudocode: [
        "sort edges by weight ascending",
        "for each edge (u, v):",
        "  if find(u) != find(v):",
        "    union(u, v); add (u, v) to MST",
      ],
    },
    "graph-toposort": {
      title: "Topological Sort",
      description: "Linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u \u2192 v, u comes before v.",
      complexity: { time: "O(V + E)", space: "O(V)", best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
      advantages: ["Resolves prerequisite orderings linearly", "Detects cycles in directed graphs"],
      disadvantages: ["Only possible on Directed Acyclic Graphs (DAGs)"],
      applications: ["Build task dependency management (Make, Webpack)", "Course prerequisite scheduling"],
      pseudocode: [
        "dfs(u):",
        "  visited.add(u)",
        "  for v in adj[u]:",
        "    if v not in visited: dfs(v)",
        "  order.unshift(u)",
      ],
    },

    // --- Dynamic Programming ---
    "dp-fibonacci": {
      title: "Fibonacci (DP Tabulation)",
      description: "Computes the n-th Fibonacci number bottom-up by storing previously computed subproblems in a table.",
      complexity: { time: "O(n)", space: "O(n)", best: "O(n)", average: "O(n)", worst: "O(n)" },
      advantages: ["Eliminates exponential redundancy of naive recursion (from O(2^n) to O(n))"],
      disadvantages: ["Requires O(n) table memory (or O(1) with 2 variables)"],
      applications: ["Dynamic programming intro", "Population growth modeling"],
      pseudocode: [
        "dp[0] = 0; dp[1] = 1",
        "for i in 2 to n:",
        "  dp[i] = dp[i-1] + dp[i-2]",
        "return dp[n]",
      ],
    },
    "dp-coinchange": {
      title: "Coin Change (Min Coins)",
      description: "Determines the minimum number of coins needed to make a given target amount using dynamic programming.",
      complexity: { time: "O(amount \u00B7 n)", space: "O(amount)", best: "O(amount \u00B7 n)", average: "O(amount \u00B7 n)", worst: "O(amount \u00B7 n)" },
      advantages: ["Optimal minimum coin count", "Works for any denomination set"],
      disadvantages: ["Requires O(amount) table size"],
      applications: ["Vending machines", "Currency exchange systems"],
      pseudocode: [
        "dp = array of size (amount + 1) filled with Infinity",
        "dp[0] = 0",
        "for a in 1 to amount:",
        "  for coin in coins:",
        "    if coin <= a: dp[a] = min(dp[a], dp[a - coin] + 1)",
        "return dp[amount]",
      ],
    },
    "dp-knapsack": {
      title: "0/1 Knapsack Problem",
      description: "Finds the subset of items that maximizes total value without exceeding a specified weight capacity.",
      complexity: { time: "O(n \u00B7 W)", space: "O(n \u00B7 W)", best: "O(n \u00B7 W)", average: "O(n \u00B7 W)", worst: "O(n \u00B7 W)" },
      advantages: ["Exact optimal selection for bounded weights"],
      disadvantages: ["Pseudo-polynomial time depending on capacity W"],
      applications: ["Resource allocation", "Cargo loading", "Portfolio optimization"],
      pseudocode: [
        "for i in 1 to n:",
        "  for w in 0 to capacity:",
        "    if weights[i-1] <= w:",
        "      dp[i][w] = max(dp[i-1][w], dp[i-1][w - weights[i-1]] + values[i-1])",
        "    else: dp[i][w] = dp[i-1][w]",
      ],
    },
    "dp-lcs": {
      title: "Longest Common Subsequence (LCS)",
      description: "Finds the longest subsequence present in both strings in the same relative order using a 2D DP grid.",
      complexity: { time: "O(m \u00B7 n)", space: "O(m \u00B7 n)", best: "O(m \u00B7 n)", average: "O(m \u00B7 n)", worst: "O(m \u00B7 n)" },
      advantages: ["Accurate string similarity and diff computation"],
      disadvantages: ["Quadratic space and time"],
      applications: ["Git diff engines", "Bioinformatics DNA sequence alignment", "Plagiarism detection"],
      pseudocode: [
        "for i in 1 to m:",
        "  for j in 1 to n:",
        "    if strA[i-1] == strB[j-1]: dp[i][j] = dp[i-1][j-1] + 1",
        "    else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
      ],
    },

    // --- Backtracking ---
    "backtrack-nqueens": {
      title: "N-Queens Problem",
      description: "Places N non-attacking queens on an N\u00D7N chessboard by exploring row-by-row and backtracking upon conflict.",
      complexity: { time: "O(N!)", space: "O(N)", best: "O(N)", average: "O(N!)", worst: "O(N!)" },
      advantages: ["Prunes invalid branches early without checking all N^N combinations"],
      disadvantages: ["Exponential worst case for large N"],
      applications: ["Constraint satisfaction problems", "Circuit layout routing"],
      pseudocode: [
        "solve(row):",
        "  if row == N: return true (solution found)",
        "  for col in 0 to N-1:",
        "    if isSafe(row, col):",
        "      placeQueen(row, col)",
        "      if solve(row + 1): return true",
        "      removeQueen(row, col) (backtrack)",
        "  return false",
      ],
    },
    "backtrack-ratmaze": {
      title: "Rat in a Maze",
      description: "Finds a path from entrance (0,0) to exit (N-1,N-1) in a grid with obstacles by moving and backtracking on dead ends.",
      complexity: { time: "O(2^(N\u00B2))", space: "O(N\u00B2)", best: "O(N)", average: "O(2^(N\u00B2))", worst: "O(2^(N\u00B2))" },
      advantages: ["Guaranteed to find a path if one exists", "Memory-efficient path tracking"],
      disadvantages: ["Can explore many dead ends before finding destination"],
      applications: ["Robotic path planning", "Game AI navigation", "Maze solving"],
      pseudocode: [
        "solve(x, y):",
        "  if (x, y) is destination: mark path; return true",
        "  if isSafe(x, y):",
        "    mark (x, y) in path",
        "    for each move (dx, dy):",
        "      if solve(x + dx, y + dy): return true",
        "    unmark (x, y) (backtrack)",
        "  return false",
      ],
    },
    "backtrack-sudoku": {
      title: "Sudoku Solver",
      description: "Fills empty cells with numbers 1..9, ensuring each row, column, and 3\u00D73 box has unique numbers via backtracking.",
      complexity: { time: "O(9^(empty_cells))", space: "O(N\u00B2)", best: "O(1)", average: "O(9^m)", worst: "O(9^m)" },
      advantages: ["Solves any valid Sudoku puzzle systematically"],
      disadvantages: ["Can require thousands of trial placements for expert puzzles"],
      applications: ["Constraint programming", "Puzzle generation & validation"],
      pseudocode: [
        "solve():",
        "  find next empty cell (r, c)",
        "  if no empty cell: return true (solved)",
        "  for val in 1 to 9:",
        "    if isValid(r, c, val):",
        "      board[r][c] = val",
        "      if solve(): return true",
        "      board[r][c] = 0 (backtrack)",
        "  return false",
      ],
    },
  };

  const DEFAULT_META = {
    title: "Select a Topic",
    description: "Choose a data structure or algorithm from the sidebar to begin visualizing.",
    complexity: { time: "-", space: "-", best: "-", average: "-", worst: "-" },
    advantages: [],
    disadvantages: [],
    applications: [],
    pseudocode: ["// Select an algorithm to view its pseudocode"],
  };

  /* ========================================================================
     3. STATS MANAGER
     ======================================================================== */
  class StatsManager {
    constructor(dom) {
      this.dom = dom;
      this.reset();
    }
    reset() {
      this.comparisons = 0;
      this.swaps = 0;
      this.accesses = 0;
      this.startTime = null;
      this.elapsed = 0;
      this.currentStep = 0;
      this.totalSteps = 0;
      this.render();
    }
    startTimer() {
      if (this.startTime === null) {
        this.startTime = performance.now();
      }
    }
    stopTimer() {
      if (this.startTime !== null) {
        this.elapsed += performance.now() - this.startTime;
        this.startTime = null;
      }
    }
    setSnapshot(stats = {}) {
      this.comparisons = stats.comparisons || 0;
      this.swaps = stats.swaps || 0;
      this.accesses = stats.accesses || 0;
      this.render();
    }
    setStep(current, total) {
      this.currentStep = current;
      this.totalSteps = total;
      this.render();
    }
    render() {
      const { dom } = this;
      const liveElapsed = this.elapsed + (this.startTime !== null ? performance.now() - this.startTime : 0);
      if (dom.statComparisons) dom.statComparisons.textContent = String(this.comparisons);
      if (dom.statSwaps) dom.statSwaps.textContent = String(this.swaps);
      if (dom.statAccesses) dom.statAccesses.textContent = String(this.accesses);
      if (dom.statTime) dom.statTime.textContent = Utils.formatTime(liveElapsed);
      if (dom.statCurrentStep) dom.statCurrentStep.textContent = `${this.currentStep} / ${this.totalSteps}`;
    }
  }

  /* ========================================================================
     4. EXECUTION LOG
     ======================================================================== */
  class Logger {
    constructor(listEl) {
      this.listEl = listEl;
      this.entries = [];
    }
    clear() {
      this.entries = [];
      if (this.listEl) this.listEl.innerHTML = "";
    }
    log(message, level = "info") {
      this.entries.push({ message, level });
      if (!this.listEl) return;
      const li = Utils.createEl("li", `log-entry log-entry--${level}`, message);
      this.listEl.appendChild(li);
      this.listEl.scrollTop = this.listEl.scrollHeight;
    }
  }

  /* ========================================================================
     5. PSEUDOCODE PANEL
     ======================================================================== */
  class PseudocodeManager {
    constructor(codeEl) {
      this.codeEl = codeEl;
      this.lines = [];
    }
    setCode(lines) {
      this.lines = lines || [];
      if (!this.codeEl) return;
      this.codeEl.innerHTML = "";
      this.lines.forEach((line, idx) => {
        const span = Utils.createEl("span", "pseudo-line", line);
        span.dataset.line = String(idx);
        span.style.display = "block";
        this.codeEl.appendChild(span);
      });
    }
    highlight(lineIndex) {
      if (!this.codeEl) return;
      Utils.$all(".pseudo-line", this.codeEl).forEach((el, idx) => {
        el.classList.toggle("is-active", idx === lineIndex);
      });
    }
  }

  /* ========================================================================
     6. INFO PANEL
     ======================================================================== */
  class InfoPanelManager {
    constructor(dom) {
      this.dom = dom;
    }
    update(meta) {
      const m = meta || DEFAULT_META;
      const d = this.dom;
      if (d.algorithmTitle) d.algorithmTitle.textContent = m.title || "Algorithm";
      if (d.algorithmDescription) d.algorithmDescription.textContent = m.description || "";
      if (d.complexityTime) d.complexityTime.textContent = m.complexity?.time || "-";
      if (d.complexitySpace) d.complexitySpace.textContent = m.complexity?.space || "-";
      this.setText(d.infoTimeComplexity, m.complexity?.time || "-");
      this.setText(d.infoSpaceComplexity, m.complexity?.space || "-");
      this.setText(d.infoBestCase, m.complexity?.best || "-");
      this.setText(d.infoAverageCase, m.complexity?.average || "-");
      this.setText(d.infoWorstCase, m.complexity?.worst || "-");
      this.setItems(d.infoAdvantages, m.advantages);
      this.setItems(d.infoDisadvantages, m.disadvantages);
      this.setItems(d.infoApplications, m.applications);
    }
    setText(container, text) {
      if (!container) return;
      const p = container.querySelector(".info-text");
      if (p) p.textContent = text;
    }
    setItems(container, items) {
      if (!container) return;
      const ul = container.querySelector(".info-list");
      if (!ul) return;
      ul.innerHTML = "";
      if (items && items.length > 0) {
        items.forEach((item) => ul.appendChild(Utils.createEl("li", null, item)));
      } else {
        ul.appendChild(Utils.createEl("li", null, "N/A"));
      }
    }
  }

  /* ========================================================================
     7. ANIMATION ENGINE
     ======================================================================== */
  class AnimationEngine {
    constructor({ stats, logger, pseudocode }) {
      this.stats = stats;
      this.logger = logger;
      this.pseudocode = pseudocode;
      this.frames = [];
      this.statsSnapshots = [];
      this.index = -1;
      this.playing = false;
      this.timer = null;
      this.speed = 5; // 1 to 10
      this.renderFn = null;
      this.initialFrame = null;
    }

    get delay() {
      // Speed 1 = 1000ms, Speed 5 = 450ms, Speed 10 = 30ms
      const val = Number(this.speed) || 5;
      return Math.round(1050 - val * 102);
    }

    load(frames, renderFn, initialFrame = null) {
      this.pause();
      this.frames = frames || [];
      this.renderFn = renderFn;
      this.index = -1;
      this.initialFrame = initialFrame;

      // Precalculate cumulative stats snapshots per frame for bidirectional stepping
      let c = 0, s = 0, a = 0;
      this.statsSnapshots = this.frames.map((f) => {
        if (f.statsDelta) {
          c += f.statsDelta.comparisons || 0;
          s += f.statsDelta.swaps || 0;
          a += f.statsDelta.accesses || 0;
        }
        return { comparisons: c, swaps: s, accesses: a };
      });

      this.stats.reset();
      this.stats.setStep(0, this.frames.length);
      if (this.logger) this.logger.clear();
      if (this.pseudocode) this.pseudocode.highlight(-1);
    }

    setSpeed(value) {
      this.speed = Utils.clamp(Number(value) || 5, 1, 10);
      // If playing, simply let the next tick consume the new delay without firing immediate extra frames
    }

    play() {
      if (this.playing || this.frames.length === 0) return;

      // If at end, rewind to start and replay cleanly
      if (this.index >= this.frames.length - 1) {
        this.index = -1;
        this.stats.reset();
      }

      this.playing = true;
      this.stats.startTimer();

      const runStep = () => {
        if (!this.playing) return;
        if (this.index >= this.frames.length - 1) {
          this.pause();
          if (this.logger) this.logger.log("Visualization complete.", "success");
          return;
        }
        this.stepForward();
        if (this.playing && this.index < this.frames.length - 1) {
          this.timer = setTimeout(runStep, this.delay);
        } else if (this.index >= this.frames.length - 1) {
          this.pause();
          if (this.logger) this.logger.log("Visualization complete.", "success");
        }
      };

      this.timer = setTimeout(runStep, this.delay);
    }

    pause() {
      this.playing = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.stats.stopTimer();
    }

    resume() {
      this.play();
    }

    reset() {
      this.pause();
      this.index = -1;
      this.stats.reset();
      this.stats.setStep(0, this.frames.length);
      if (this.logger) this.logger.clear();
      if (this.pseudocode) this.pseudocode.highlight(-1);
      if (this.renderFn && this.initialFrame) {
        try {
          this.renderFn(this.initialFrame);
        } catch (err) {
          console.error("Initial frame render failed on reset:", err);
        }
      }
    }

    stepForward() {
      if (this.index >= this.frames.length - 1) return;
      this.index += 1;
      this.applyCurrentFrame();
    }

    stepBackward() {
      if (this.index <= 0) {
        this.index = -1;
        this.stats.reset();
        this.stats.setStep(0, this.frames.length);
        if (this.pseudocode) this.pseudocode.highlight(-1);
        if (this.renderFn && this.initialFrame) {
          try {
            this.renderFn(this.initialFrame);
          } catch (err) {
            console.error("Failed to render initial frame:", err);
          }
        }
        return;
      }
      this.index -= 1;
      this.applyCurrentFrame();
    }

    applyCurrentFrame() {
      const frame = this.frames[this.index];
      if (!frame) return;
      try {
        if (this.renderFn) this.renderFn(frame);
        const snapshot = this.statsSnapshots[this.index] || { comparisons: 0, swaps: 0, accesses: 0 };
        this.stats.setSnapshot(snapshot);
        this.stats.setStep(this.index + 1, this.frames.length);
        if (frame.log && this.logger) this.logger.log(frame.log, frame.logLevel || "info");
        if (typeof frame.line === "number" && this.pseudocode) {
          this.pseudocode.highlight(frame.line);
        } else if (this.pseudocode) {
          this.pseudocode.highlight(-1);
        }
      } catch (err) {
        console.error("Frame render error:", err);
        if (this.logger) this.logger.log(`Error rendering step: ${err.message}`, "error");
      }
    }
  }

  /* ========================================================================
     8. RENDERERS
     ======================================================================== */

  class ArrayRenderer {
    constructor(container) {
      this.container = container;
    }
    render(frame) {
      if (!this.container) return;
      const { array = [], compared = [], swapped = [], sorted = [], active = [], pivot, eliminated = [] } = frame || {};
      this.container.innerHTML = "";

      const safeArray = Array.from({ length: array.length }, (_, i) => {
        const v = array[i];
        return Number.isFinite(v) ? v : 0;
      });

      if (safeArray.length === 0) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "No data to display."));
        return;
      }

      const minVal = Math.min(...safeArray, 0);
      const maxVal = Math.max(...safeArray, 1);
      const range = maxVal - minVal || 1;

      safeArray.forEach((value, idx) => {
        const bar = Utils.createEl("div", "array-bar");
        const heightPct = Utils.clamp(((value - minVal) / range) * 88 + 12, 6, 100);
        bar.style.height = `${heightPct}%`;
        bar.setAttribute("role", "img");
        bar.setAttribute("aria-label", `Value ${value} at index ${idx}`);

        if (sorted.includes(idx)) bar.classList.add("is-sorted");
        if (swapped.includes(idx)) bar.classList.add("is-swapped");
        if (compared.includes(idx)) bar.classList.add("is-compared");
        if (active.includes(idx)) bar.classList.add("is-active");
        if (pivot === idx) bar.classList.add("is-highlighted");
        if (eliminated.includes(idx)) bar.style.opacity = "0.25";

        const label = Utils.createEl("span", "array-bar-label", String(value));
        bar.appendChild(label);
        this.container.appendChild(bar);
      });
    }
  }

  class LinearRenderer {
    constructor(container, orientation = "row") {
      this.container = container;
      this.orientation = orientation;
    }
    render(frame) {
      if (!this.container) return;
      const { items = [], activeIndex = -1, blockClass = "stack-block", headIndex = -1, tailIndex = -1 } = frame || {};
      this.container.innerHTML = "";
      this.container.style.display = "flex";
      this.container.style.flexDirection = this.orientation === "column" ? "column-reverse" : "row";
      this.container.style.alignItems = "center";
      this.container.style.justifyContent = "center";
      this.container.style.gap = "8px";
      this.container.style.flexWrap = "wrap";

      if (items.length === 0) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "Structure is empty"));
        return;
      }

      items.forEach((value, idx) => {
        const block = Utils.createEl("div", blockClass, String(value));
        if (idx === activeIndex) block.classList.add("is-active");
        if (idx === headIndex) block.classList.add("is-current");
        if (idx === tailIndex) block.classList.add("is-highlighted");
        this.container.appendChild(block);
      });
    }
  }

  class LinkedListRenderer {
    constructor(container) {
      this.container = container;
    }
    render(frame) {
      if (!this.container) return;
      const { nodes = [], activeIndex = -1, doubly = false } = frame || {};
      this.container.innerHTML = "";
      this.container.style.display = "flex";
      this.container.style.alignItems = "center";
      this.container.style.justifyContent = "center";
      this.container.style.gap = "6px";
      this.container.style.flexWrap = "wrap";

      if (nodes.length === 0) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "Linked List is empty"));
        return;
      }

      nodes.forEach((value, idx) => {
        const node = Utils.createEl("div", "linked-list-node");
        const val = Utils.createEl("div", "node-value", String(value));
        const ptr = Utils.createEl("div", "node-pointer", doubly ? "\u2194" : "\u2192");
        node.append(val, ptr);
        if (idx === activeIndex) node.classList.add("is-active");
        this.container.appendChild(node);
      });

      const nullNode = Utils.createEl("div", "node", "\u2205");
      nullNode.style.width = "38px";
      nullNode.style.height = "38px";
      nullNode.style.fontSize = "1.2rem";
      this.container.appendChild(nullNode);
    }
  }

  class HashTableRenderer {
    constructor(container) {
      this.container = container;
    }
    render(frame) {
      if (!this.container) return;
      const { buckets = [], activeIndex = -1 } = frame || {};
      this.container.innerHTML = "";
      this.container.style.display = "grid";
      this.container.style.gridTemplateColumns = "repeat(auto-fill, minmax(130px, 1fr))";
      this.container.style.gap = "10px";

      buckets.forEach((bucket, idx) => {
        const cell = Utils.createEl("div", "hash-cell");
        cell.style.flexDirection = "column";
        cell.style.padding = "6px 8px";
        cell.style.height = "auto";
        cell.style.minHeight = "54px";

        const idxLabel = Utils.createEl("div", "hash-cell-index", `Bucket #${idx}`);
        const contentText = bucket && bucket.length ? bucket.join(" \u2192 ") : "\u2014";
        const content = Utils.createEl("div", null, contentText);
        content.style.fontSize = "0.85rem";
        content.style.wordBreak = "break-all";

        cell.append(idxLabel, content);
        if (idx === activeIndex) cell.classList.add("is-active");
        this.container.appendChild(cell);
      });
    }
  }

  class TreeRenderer {
    constructor(container) {
      this.container = container;
      this.svg = null;
      this._ensureSvg();
    }
    _ensureSvg() {
      if (!this.container) return;
      this.container.style.position = "relative";
      this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this.svg.setAttribute("width", "100%");
      this.svg.setAttribute("height", "100%");
      this.svg.style.position = "absolute";
      this.svg.style.inset = "0";
      this.svg.style.pointerEvents = "none";
    }
    render(frame) {
      if (!this.container) return;
      const { positions = [], edges = [] } = frame || {};
      this.container.innerHTML = "";
      this._ensureSvg();
      this.container.appendChild(this.svg);
      this.svg.innerHTML = "";

      edges.forEach((edge) => {
        if (!edge.from || !edge.to) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", edge.from.x);
        line.setAttribute("y1", edge.from.y);
        line.setAttribute("x2", edge.to.x);
        line.setAttribute("y2", edge.to.y);
        line.setAttribute("class", `graph-edge${edge.highlighted ? " edge-highlighted" : ""}`);
        this.svg.appendChild(line);
      });

      positions.forEach((node) => {
        const el = Utils.createEl("div", "node tree-node", String(node.value));
        el.style.position = "absolute";
        el.style.left = `${node.x - 24}px`;
        el.style.top = `${node.y - 24}px`;
        if (node.state) el.classList.add(`is-${node.state}`);
        this.container.appendChild(el);
      });

      if (positions.length === 0) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "Tree is empty"));
      }
    }
  }

  class TrieRenderer extends TreeRenderer {
    render(frame) {
      super.render(frame);
      Utils.$all(".tree-node", this.container).forEach((el) => el.classList.add("trie-node"));
    }
  }

  class GraphRenderer {
    constructor(container, onNodeDrag) {
      this.container = container;
      this.onNodeDrag = onNodeDrag;
      this.svg = null;
    }
    render(frame) {
      if (!this.container) return;
      const { nodes = [], edges = [], directed = false } = frame || {};
      this.container.innerHTML = "";
      this.container.style.position = "relative";
      this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this.svg.setAttribute("width", "100%");
      this.svg.setAttribute("height", "100%");
      this.svg.style.position = "absolute";
      this.svg.style.inset = "0";
      this.container.appendChild(this.svg);

      // SVG arrowhead marker for directed graphs
      if (directed) {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "22");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
        polygon.setAttribute("fill", "var(--color-secondary, #22d3ee)");
        marker.appendChild(polygon);
        defs.appendChild(marker);
        this.svg.appendChild(defs);
      }

      edges.forEach((edge) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);
        line.setAttribute("class", `graph-edge${edge.highlighted ? " edge-highlighted" : ""}`);
        if (directed) line.setAttribute("marker-end", "url(#arrowhead)");
        this.svg.appendChild(line);

        if (edge.weight !== undefined) {
          const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("x", (from.x + to.x) / 2);
          label.setAttribute("y", (from.y + to.y) / 2 - 4);
          label.setAttribute("fill", "var(--color-text-secondary, #9ba1c0)");
          label.setAttribute("font-size", "12");
          label.setAttribute("font-family", "monospace");
          label.textContent = String(edge.weight);
          this.svg.appendChild(label);
        }
      });

      nodes.forEach((node) => {
        const el = Utils.createEl("div", "node graph-node", String(node.label ?? node.id));
        el.style.position = "absolute";
        el.style.left = `${node.x - 24}px`;
        el.style.top = `${node.y - 24}px`;
        el.dataset.nodeId = String(node.id);
        if (node.state) el.classList.add(`is-${node.state}`);
        this._makeDraggable(el, node);
        this.container.appendChild(el);
      });

      if (nodes.length === 0) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "Click 'Generate Random Data' to build a graph"));
      }
    }
    _makeDraggable(el, node) {
      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;
      el.style.cursor = "grab";
      el.addEventListener("pointerdown", (e) => {
        dragging = true;
        el.setPointerCapture(e.pointerId);
        const rect = this.container.getBoundingClientRect();
        offsetX = e.clientX - rect.left - node.x;
        offsetY = e.clientY - rect.top - node.y;
        el.style.cursor = "grabbing";
      });
      el.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const rect = this.container.getBoundingClientRect();
        node.x = Utils.clamp(e.clientX - rect.left - offsetX, 24, rect.width - 24);
        node.y = Utils.clamp(e.clientY - rect.top - offsetY, 24, rect.height - 24);
        el.style.left = `${node.x - 24}px`;
        el.style.top = `${node.y - 24}px`;
        if (this.onNodeDrag) this.onNodeDrag(node);
      });
      el.addEventListener("pointerup", (e) => {
        dragging = false;
        el.style.cursor = "grab";
        el.releasePointerCapture(e.pointerId);
      });
    }
  }

  class TableRenderer {
    constructor(container) {
      this.container = container;
    }
    render(frame) {
      if (!this.container) return;
      const { table = [], activeCell, rowLabels = [], colLabels = [] } = frame || {};
      this.container.innerHTML = "";
      if (!table.length) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "No table data to display."));
        return;
      }
      const el = Utils.createEl("table", "complexity-table dp-table");
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      headRow.appendChild(document.createElement("th"));
      colLabels.forEach((label) => headRow.appendChild(Utils.createEl("th", null, String(label))));
      thead.appendChild(headRow);
      el.appendChild(thead);

      const tbody = document.createElement("tbody");
      table.forEach((row, r) => {
        const tr = document.createElement("tr");
        tr.appendChild(Utils.createEl("th", null, String(rowLabels[r] ?? r)));
        row.forEach((cell, c) => {
          const td = Utils.createEl("td", null, cell === null || cell === undefined ? "\u2014" : String(cell));
          if (activeCell && activeCell[0] === r && activeCell[1] === c) td.classList.add("is-active");
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      el.appendChild(tbody);
      this.container.appendChild(el);
    }
  }

  class GridRenderer {
    constructor(container) {
      this.container = container;
    }
    render(frame) {
      if (!this.container) return;
      const { grid = [], activeCell } = frame || {};
      this.container.innerHTML = "";
      if (!grid.length || !grid[0]) {
        this.container.appendChild(Utils.createEl("p", "placeholder-text", "No grid data to display."));
        return;
      }
      const gridEl = Utils.createEl("div", "backtrack-grid");
      gridEl.style.display = "grid";
      gridEl.style.gridTemplateColumns = `repeat(${grid[0]?.length || 1}, 40px)`;
      gridEl.style.gap = "4px";
      gridEl.style.justifyContent = "center";

      grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          const cellEl = Utils.createEl("div", "node");
          cellEl.style.width = "40px";
          cellEl.style.height = "40px";
          cellEl.style.borderRadius = "6px";

          if (cell === "#" || cell === "WALL") {
            cellEl.textContent = "";
            cellEl.style.background = "var(--color-card-solid, #161b2e)";
            cellEl.style.borderColor = "var(--color-danger, #fb7185)";
          } else {
            cellEl.textContent = cell === 0 || cell === "" ? "" : String(cell);
            if (activeCell && activeCell[0] === r && activeCell[1] === c) cellEl.classList.add("is-current");
            if (cell && cell !== 0 && cell !== ".") cellEl.classList.add("is-success");
          }
          gridEl.appendChild(cellEl);
        });
      });
      this.container.appendChild(gridEl);
    }
  }

  /* ========================================================================
     9. SORTING ALGORITHMS
     ======================================================================== */
  class SortingAlgorithms {
    static _baseFrame(array, extra = {}) {
      return { array: array.slice(), compared: [], swapped: [], sorted: [], active: [], statsDelta: {}, ...extra };
    }

    static bubbleSort(input) {
      const arr = input.slice();
      const frames = [];
      const n = arr.length;
      const sortedIdx = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          frames.push(
            this._baseFrame(arr, {
              compared: [j, j + 1],
              sorted: sortedIdx.slice(),
              line: 2,
              log: `Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}`,
              statsDelta: { comparisons: 1, accesses: 2 },
            })
          );
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            frames.push(
              this._baseFrame(arr, {
                swapped: [j, j + 1],
                sorted: sortedIdx.slice(),
                line: 3,
                log: `Swap arr[${j}] and arr[${j + 1}]`,
                statsDelta: { swaps: 1, accesses: 2 },
              })
            );
          }
        }
        sortedIdx.unshift(n - i - 1);
      }
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), line: 4, log: "Bubble sort complete. Array fully sorted." }));
      return frames;
    }

    static selectionSort(input) {
      const arr = input.slice();
      const frames = [];
      const n = arr.length;
      const sortedIdx = [];
      for (let i = 0; i < n; i++) {
        let min = i;
        for (let j = i + 1; j < n; j++) {
          frames.push(
            this._baseFrame(arr, {
              compared: [min, j],
              active: [min],
              sorted: sortedIdx.slice(),
              line: 3,
              log: `Compare current min arr[${min}]=${arr[min]} with arr[${j}]=${arr[j]}`,
              statsDelta: { comparisons: 1, accesses: 2 },
            })
          );
          if (arr[j] < arr[min]) {
            min = j;
          }
        }
        if (min !== i) {
          [arr[i], arr[min]] = [arr[min], arr[i]];
          frames.push(
            this._baseFrame(arr, {
              swapped: [i, min],
              sorted: sortedIdx.slice(),
              line: 4,
              log: `Swap minimum arr[${min}] into position ${i}`,
              statsDelta: { swaps: 1, accesses: 2 },
            })
          );
        }
        sortedIdx.push(i);
      }
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Selection sort complete." }));
      return frames;
    }

    static insertionSort(input) {
      const arr = input.slice();
      const frames = [];
      const n = arr.length;
      for (let i = 1; i < n; i++) {
        let j = i - 1;
        const key = arr[i];
        frames.push(this._baseFrame(arr, { active: [i], sorted: Array.from({ length: i }, (_, k) => k), line: 1, log: `Pick key ${key} at index ${i}` }));
        while (j >= 0) {
          frames.push(
            this._baseFrame(arr, { compared: [j, j + 1], active: [j + 1], line: 2, log: `Compare key ${key} with arr[${j}]=${arr[j]}`, statsDelta: { comparisons: 1, accesses: 1 } })
          );
          if (arr[j] > key) {
            arr[j + 1] = arr[j];
            j -= 1;
            frames.push(this._baseFrame(arr, { swapped: [j + 1], line: 3, log: `Shift ${arr[j + 1]} right to index ${j + 2}`, statsDelta: { swaps: 1, accesses: 1 } }));
          } else {
            break;
          }
        }
        arr[j + 1] = key;
        frames.push(this._baseFrame(arr, { active: [j + 1], sorted: Array.from({ length: i + 1 }, (_, k) => k), line: 4, log: `Insert key ${key} at index ${j + 1}`, statsDelta: { accesses: 1 } }));
      }
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Insertion sort complete." }));
      return frames;
    }

    static mergeSort(input) {
      const arr = input.slice();
      const frames = [];

      const merge = (start, mid, end) => {
        const left = arr.slice(start, mid + 1);
        const right = arr.slice(mid + 1, end + 1);
        let i = 0, j = 0, k = start;

        while (i < left.length && j < right.length) {
          frames.push(this._baseFrame(arr, { compared: [start + i, mid + 1 + j], active: [k], line: 5, log: `Compare left ${left[i]} with right ${right[j]}`, statsDelta: { comparisons: 1, accesses: 2 } }));
          if (left[i] <= right[j]) {
            arr[k] = left[i++];
          } else {
            arr[k] = right[j++];
          }
          frames.push(this._baseFrame(arr, { active: [k], log: `Merged ${arr[k]} into position ${k}`, statsDelta: { swaps: 1, accesses: 1 } }));
          k++;
        }

        while (i < left.length) {
          arr[k] = left[i++];
          frames.push(this._baseFrame(arr, { active: [k], log: `Copy remaining left ${arr[k]} into position ${k}`, statsDelta: { accesses: 1 } }));
          k++;
        }
        while (j < right.length) {
          arr[k] = right[j++];
          frames.push(this._baseFrame(arr, { active: [k], log: `Copy remaining right ${arr[k]} into position ${k}`, statsDelta: { accesses: 1 } }));
          k++;
        }
      };

      const sort = (start, end) => {
        if (start >= end) return;
        const mid = Math.floor((start + end) / 2);
        sort(start, mid);
        sort(mid + 1, end);
        merge(start, mid, end);
      };

      if (arr.length > 0) sort(0, arr.length - 1);
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Merge sort complete." }));
      return frames;
    }

    static quickSort(input) {
      const arr = input.slice();
      const frames = [];
      const sortedIdx = [];

      const partition = (lo, hi) => {
        const pivot = arr[hi];
        let i = lo - 1;
        for (let j = lo; j < hi; j++) {
          frames.push(this._baseFrame(arr, { compared: [j, hi], pivot: hi, sorted: sortedIdx.slice(), line: 2, log: `Compare arr[${j}]=${arr[j]} with pivot ${pivot}`, statsDelta: { comparisons: 1, accesses: 1 } }));
          if (arr[j] < pivot) {
            i += 1;
            if (i !== j) {
              [arr[i], arr[j]] = [arr[j], arr[i]];
              frames.push(this._baseFrame(arr, { swapped: [i, j], pivot: hi, sorted: sortedIdx.slice(), log: `Swap arr[${i}] and arr[${j}]`, statsDelta: { swaps: 1, accesses: 2 } }));
            }
          }
        }
        [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
        frames.push(this._baseFrame(arr, { swapped: [i + 1, hi], pivot: i + 1, sorted: sortedIdx.slice(), line: 3, log: `Place pivot ${pivot} at sorted index ${i + 1}`, statsDelta: { swaps: 1, accesses: 2 } }));
        sortedIdx.push(i + 1);
        return i + 1;
      };

      const sort = (lo, hi) => {
        if (lo >= hi) {
          if (lo === hi) sortedIdx.push(lo);
          return;
        }
        const p = partition(lo, hi);
        sort(lo, p - 1);
        sort(p + 1, hi);
      };

      if (arr.length > 0) sort(0, arr.length - 1);
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Quick sort complete." }));
      return frames;
    }

    static heapSort(input) {
      const arr = input.slice();
      const frames = [];
      const n = arr.length;
      const sortedIdx = [];

      const heapify = (size, root) => {
        let largest = root;
        const l = 2 * root + 1;
        const r = 2 * root + 2;
        if (l < size) {
          frames.push(this._baseFrame(arr, { compared: [l, largest], sorted: sortedIdx.slice(), statsDelta: { comparisons: 1, accesses: 2 } }));
          if (arr[l] > arr[largest]) largest = l;
        }
        if (r < size) {
          frames.push(this._baseFrame(arr, { compared: [r, largest], sorted: sortedIdx.slice(), statsDelta: { comparisons: 1, accesses: 2 } }));
          if (arr[r] > arr[largest]) largest = r;
        }
        if (largest !== root) {
          [arr[root], arr[largest]] = [arr[largest], arr[root]];
          frames.push(this._baseFrame(arr, { swapped: [root, largest], sorted: sortedIdx.slice(), line: 3, log: `Heapify swap arr[${root}] and arr[${largest}]`, statsDelta: { swaps: 1, accesses: 2 } }));
          heapify(size, largest);
        }
      };

      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(n, i);
      }

      for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        sortedIdx.unshift(i);
        frames.push(this._baseFrame(arr, { swapped: [0, i], sorted: sortedIdx.slice(), line: 2, log: `Extract max ${arr[i]} to index ${i}`, statsDelta: { swaps: 1, accesses: 2 } }));
        heapify(i, 0);
      }
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Heap sort complete." }));
      return frames;
    }

    static shellSort(input) {
      const arr = input.slice();
      const frames = [];
      const n = arr.length;
      for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        frames.push(this._baseFrame(arr, { line: 0, log: `Testing with gap = ${gap}` }));
        for (let i = gap; i < n; i++) {
          const temp = arr[i];
          let j = i;
          while (j >= gap) {
            frames.push(this._baseFrame(arr, { compared: [j, j - gap], line: 4, log: `Compare arr[${j}]=${arr[j]} and arr[${j - gap}]=${arr[j - gap]} (gap ${gap})`, statsDelta: { comparisons: 1, accesses: 2 } }));
            if (arr[j - gap] > temp) {
              arr[j] = arr[j - gap];
              j -= gap;
              frames.push(this._baseFrame(arr, { swapped: [j + gap, j], line: 5, statsDelta: { swaps: 1, accesses: 1 } }));
            } else {
              break;
            }
          }
          arr[j] = temp;
          frames.push(this._baseFrame(arr, { active: [j], line: 6, log: `Placed ${temp} at index ${j}`, statsDelta: { accesses: 1 } }));
        }
      }
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Shell sort complete." }));
      return frames;
    }

    static countingSort(input) {
      const arr = input.slice();
      const frames = [];
      if (!arr.length) return frames;

      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const range = max - min + 1;
      const count = new Array(range).fill(0);

      arr.forEach((v) => { count[v - min] += 1; });
      for (let i = 1; i < range; i++) count[i] += count[i - 1];

      const output = new Array(arr.length).fill(0);
      for (let i = arr.length - 1; i >= 0; i--) {
        const val = arr[i];
        const targetPos = count[val - min] - 1;
        output[targetPos] = val;
        count[val - min] -= 1;
        frames.push(this._baseFrame(output, { active: [targetPos], line: 3, log: `Placed ${val} at index ${targetPos}`, statsDelta: { accesses: 2 } }));
      }
      frames.push(this._baseFrame(output, { sorted: output.map((_, i) => i), line: 4, log: "Counting sort complete." }));
      return frames;
    }

    static radixSort(input) {
      let arr = input.slice();
      const frames = [];
      if (!arr.length) return frames;

      const max = Math.max(...arr, 0);
      for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        const output = new Array(arr.length).fill(0);
        const count = new Array(10).fill(0);
        arr.forEach((v) => { count[Math.floor(v / exp) % 10] += 1; });
        for (let i = 1; i < 10; i++) count[i] += count[i - 1];

        for (let i = arr.length - 1; i >= 0; i--) {
          const digit = Math.floor(arr[i] / exp) % 10;
          const pos = count[digit] - 1;
          output[pos] = arr[i];
          count[digit] -= 1;
          frames.push(this._baseFrame(output, { active: [pos], line: 1, log: `Digit place ${exp}: place ${arr[i]} (digit ${digit}) at index ${pos}`, statsDelta: { accesses: 2 } }));
        }
        arr = output;
      }
      frames.push(this._baseFrame(arr, { sorted: arr.map((_, i) => i), log: "Radix sort complete." }));
      return frames;
    }
  }

  /* ========================================================================
     10. SEARCHING ALGORITHMS
     ======================================================================== */
  class SearchingAlgorithms {
    static _baseFrame(array, extra = {}) {
      return { array: array.slice(), compared: [], active: [], sorted: [], eliminated: [], statsDelta: {}, ...extra };
    }

    static linearSearch(input, target) {
      const arr = input.slice();
      const frames = [];
      for (let i = 0; i < arr.length; i++) {
        frames.push(this._baseFrame(arr, { active: [i], line: 1, log: `Checking index ${i} (${arr[i]}) against target ${target}`, statsDelta: { comparisons: 1, accesses: 1 } }));
        if (arr[i] === target) {
          frames.push(this._baseFrame(arr, { sorted: [i], line: 1, log: `Found target ${target} at index ${i}!`, logLevel: "success" }));
          return frames;
        }
      }
      frames.push(this._baseFrame(arr, { line: 2, log: `Target ${target} not found in array.`, logLevel: "error" }));
      return frames;
    }

    static binarySearch(input, target) {
      const arr = input.slice().sort((a, b) => a - b);
      const frames = [];
      let lo = 0, hi = arr.length - 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const eliminated = [];
        for (let i = 0; i < lo; i++) eliminated.push(i);
        for (let i = hi + 1; i < arr.length; i++) eliminated.push(i);

        frames.push(this._baseFrame(arr, { active: [mid], compared: [lo, hi], eliminated, line: 2, log: `Check mid index ${mid} (${arr[mid]}) in range [${lo}..${hi}]`, statsDelta: { comparisons: 1, accesses: 1 } }));

        if (arr[mid] === target) {
          frames.push(this._baseFrame(arr, { sorted: [mid], line: 3, log: `Found target ${target} at index ${mid}!`, logLevel: "success" }));
          return frames;
        }
        if (arr[mid] < target) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      const eliminated = arr.map((_, i) => i);
      frames.push(this._baseFrame(arr, { eliminated, line: 5, log: `Target ${target} not found.`, logLevel: "error" }));
      return frames;
    }

    static jumpSearch(input, target) {
      const arr = input.slice().sort((a, b) => a - b);
      const frames = [];
      const n = arr.length;
      const step = Math.floor(Math.sqrt(n)) || 1;
      let prev = 0;
      let curr = step;

      while (curr < n && arr[Math.min(curr, n) - 1] < target) {
        frames.push(this._baseFrame(arr, { active: [Math.min(curr, n) - 1], line: 1, log: `Jump block [${prev}..${Math.min(curr, n) - 1}] ending with value ${arr[Math.min(curr, n) - 1]}`, statsDelta: { comparisons: 1, accesses: 1 } }));
        prev = curr;
        curr += step;
      }

      for (let i = prev; i < Math.min(curr, n); i++) {
        frames.push(this._baseFrame(arr, { active: [i], compared: [prev, Math.min(curr, n) - 1], line: 2, log: `Linear check index ${i} (${arr[i]}) for target ${target}`, statsDelta: { comparisons: 1, accesses: 1 } }));
        if (arr[i] === target) {
          frames.push(this._baseFrame(arr, { sorted: [i], line: 2, log: `Found target ${target} at index ${i}!`, logLevel: "success" }));
          return frames;
        }
      }
      frames.push(this._baseFrame(arr, { log: `Target ${target} not found.`, logLevel: "error" }));
      return frames;
    }

    static interpolationSearch(input, target) {
      const arr = input.slice().sort((a, b) => a - b);
      const frames = [];
      let lo = 0, hi = arr.length - 1;

      while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
        if (arr[hi] === arr[lo]) {
          if (arr[lo] === target) {
            frames.push(this._baseFrame(arr, { sorted: [lo], log: `Found target ${target} at index ${lo}`, logLevel: "success" }));
            return frames;
          }
          break;
        }
        const pos = lo + Math.floor(((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]));
        const safePos = Utils.clamp(pos, lo, hi);

        frames.push(this._baseFrame(arr, { active: [safePos], compared: [lo, hi], line: 1, log: `Interpolated estimate position ${safePos} (${arr[safePos]})`, statsDelta: { comparisons: 1, accesses: 1 } }));

        if (arr[safePos] === target) {
          frames.push(this._baseFrame(arr, { sorted: [safePos], log: `Found target ${target} at index ${safePos}!`, logLevel: "success" }));
          return frames;
        }
        if (arr[safePos] < target) {
          lo = safePos + 1;
        } else {
          hi = safePos - 1;
        }
      }
      frames.push(this._baseFrame(arr, { log: `Target ${target} not found.`, logLevel: "error" }));
      return frames;
    }
  }

  /* ========================================================================
     11. LINEAR DATA STRUCTURES
     ======================================================================== */
  class LinearStructure {
    constructor(kind) {
      this.kind = kind; // 'stack' | 'queue'
      this.items = [];
    }
    push(values) {
      const valList = Array.isArray(values) ? values : [values];
      const frames = [];
      valList.forEach((v) => {
        this.items.push(v);
        frames.push({
          items: this.items.slice(),
          activeIndex: this.items.length - 1,
          blockClass: this.kind === "stack" ? "stack-block" : "queue-block",
          log: `Inserted ${v} into ${this.kind}`,
          statsDelta: { accesses: 1 },
        });
      });
      return frames;
    }
    pop() {
      if (this.items.length === 0) {
        return [{ items: [], log: `Underflow: ${this.kind} is empty.`, logLevel: "error" }];
      }
      const val = this.kind === "queue" ? this.items.shift() : this.items.pop();
      return [{
        items: this.items.slice(),
        activeIndex: -1,
        blockClass: this.kind === "stack" ? "stack-block" : "queue-block",
        log: `Removed ${val} from ${this.kind}`,
        statsDelta: { accesses: 1 },
      }];
    }
  }

  class LinkedListStructure {
    constructor(doubly = false) {
      this.doubly = doubly;
      this.items = [];
    }
    insertValues(values) {
      const valList = Array.isArray(values) ? values : [values];
      const frames = [];
      valList.forEach((v) => {
        this.items.push(v);
        frames.push({
          nodes: this.items.slice(),
          activeIndex: this.items.length - 1,
          doubly: this.doubly,
          log: `Inserted node with value ${v}`,
          statsDelta: { accesses: 1 },
        });
      });
      return frames;
    }
    deleteAt(index) {
      if (index < 0 || index >= this.items.length) {
        return [{ nodes: this.items.slice(), doubly: this.doubly, log: "Invalid index.", logLevel: "error" }];
      }
      const [removed] = this.items.splice(index, 1);
      return [{ nodes: this.items.slice(), activeIndex: -1, doubly: this.doubly, log: `Deleted ${removed} from index ${index}`, statsDelta: { accesses: 1 } }];
    }
    traverse() {
      const frames = [];
      for (let i = 0; i < this.items.length; i++) {
        frames.push({ nodes: this.items.slice(), activeIndex: i, doubly: this.doubly, log: `Visit node #${i}: ${this.items[i]}`, statsDelta: { accesses: 1 } });
      }
      return frames;
    }
  }

  class HashTableStructure {
    constructor(size = 8) {
      this.size = size;
      this.buckets = Array.from({ length: size }, () => []);
    }
    _hash(key) {
      const str = String(key);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % this.size;
      }
      return hash;
    }
    insert(key, value) {
      const idx = this._hash(key);
      this.buckets[idx].push(`${key}:${value}`);
      return [{
        buckets: this.buckets.map((b) => b.slice()),
        activeIndex: idx,
        log: `Hash("${key}") = ${idx} \u2192 placed ${key}:${value} in bucket #${idx}`,
        statsDelta: { accesses: 1 },
      }];
    }
  }

  /* ========================================================================
     12. TREE STRUCTURES
     ======================================================================== */
  class TreeNodeModel {
    constructor(value) {
      this.value = value;
      this.left = null;
      this.right = null;
      this.height = 1;
    }
  }

  function layoutTree(root, width = 620, levelHeight = 70) {
    const positions = [];
    let counter = 0;
    const inorderCount = (node) => {
      if (!node) return 0;
      return inorderCount(node.left) + 1 + inorderCount(node.right);
    };
    const total = inorderCount(root) || 1;
    const step = width / (total + 1);

    const visit = (node, depth) => {
      if (!node) return;
      visit(node.left, depth + 1);
      counter += 1;
      const x = counter * step;
      const y = depth * levelHeight + 35;
      node._pos = { x, y };
      positions.push({ id: node, value: node.value, x, y, state: node.state });
      visit(node.right, depth + 1);
    };
    visit(root, 0);

    const edges = [];
    const connect = (node) => {
      if (!node) return;
      if (node.left) {
        edges.push({ from: node._pos, to: node.left._pos });
        connect(node.left);
      }
      if (node.right) {
        edges.push({ from: node._pos, to: node.right._pos });
        connect(node.right);
      }
    };
    connect(root);
    return { positions, edges };
  }

  class BSTStructure {
    constructor() {
      this.root = null;
    }
    frame(log, activeValue) {
      const { positions, edges } = layoutTree(this.root);
      positions.forEach((p) => {
        if (p.value === activeValue) p.state = "active";
      });
      return { positions, edges, log, statsDelta: { accesses: 1 } };
    }
    insert(value) {
      const frames = [];
      const insertNode = (node) => {
        if (!node) return new TreeNodeModel(value);
        frames.push(this.frame(`Compare ${value} with node ${node.value}`, node.value));
        if (value < node.value) node.left = insertNode(node.left);
        else if (value > node.value) node.right = insertNode(node.right);
        return node;
      };
      this.root = insertNode(this.root);
      frames.push(this.frame(`Inserted ${value}`, value));
      return frames;
    }
  }

  class AVLStructure extends BSTStructure {
    _height(node) { return node ? node.height : 0; }
    _balance(node) { return node ? this._height(node.left) - this._height(node.right) : 0; }
    _update(node) { node.height = 1 + Math.max(this._height(node.left), this._height(node.right)); }
    _rotateRight(y) {
      const x = y.left;
      y.left = x.right;
      x.right = y;
      this._update(y);
      this._update(x);
      return x;
    }
    _rotateLeft(x) {
      const y = x.right;
      x.right = y.left;
      y.left = x;
      this._update(x);
      this._update(y);
      return y;
    }
    insert(value) {
      const frames = [];
      const insertNode = (node) => {
        if (!node) return new TreeNodeModel(value);
        frames.push(this.frame(`Compare ${value} with node ${node.value}`, node.value));
        if (value < node.value) node.left = insertNode(node.left);
        else if (value > node.value) node.right = insertNode(node.right);
        else return node;

        this._update(node);
        const balance = this._balance(node);

        if (balance > 1 && value < node.left.value) {
          frames.push(this.frame(`Right rotate at ${node.value} (balance = ${balance})`, node.value));
          return this._rotateRight(node);
        }
        if (balance < -1 && value > node.right.value) {
          frames.push(this.frame(`Left rotate at ${node.value} (balance = ${balance})`, node.value));
          return this._rotateLeft(node);
        }
        if (balance > 1 && value > node.left.value) {
          node.left = this._rotateLeft(node.left);
          frames.push(this.frame(`Left-Right rotate at ${node.value}`, node.value));
          return this._rotateRight(node);
        }
        if (balance < -1 && value < node.right.value) {
          node.right = this._rotateRight(node.right);
          frames.push(this.frame(`Right-Left rotate at ${node.value}`, node.value));
          return this._rotateLeft(node);
        }
        return node;
      };
      this.root = insertNode(this.root);
      frames.push(this.frame(`Inserted ${value} in balanced AVL tree`, value));
      return frames;
    }
  }

  class HeapStructure {
    constructor(isMax = true) {
      this.isMax = isMax;
      this.items = [];
    }
    _compare(a, b) {
      return this.isMax ? a > b : a < b;
    }
    frame(activeIndices, log) {
      const positions = [];
      const edges = [];
      const width = 600;
      this.items.forEach((value, i) => {
        const depth = Math.floor(Math.log2(i + 1));
        const levelStart = 2 ** depth - 1;
        const posInLevel = i - levelStart;
        const levelCount = 2 ** depth;
        const x = ((posInLevel + 1) / (levelCount + 1)) * width;
        const y = depth * 70 + 35;
        positions.push({ id: i, value, x, y, state: activeIndices?.includes(i) ? "active" : undefined });
      });
      this.items.forEach((_, i) => {
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < this.items.length) edges.push({ from: positions[i], to: positions[l] });
        if (r < this.items.length) edges.push({ from: positions[i], to: positions[r] });
      });
      return { positions, edges, log, statsDelta: { accesses: 1 } };
    }
    insert(value) {
      const frames = [];
      this.items.push(value);
      let i = this.items.length - 1;
      frames.push(this.frame([i], `Inserted ${value} at end of heap`));
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        if (this._compare(this.items[i], this.items[parent])) {
          [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
          frames.push(this.frame([i, parent], `Sift up: swap child ${this.items[parent]} with parent ${this.items[i]}`));
          i = parent;
        } else break;
      }
      return frames;
    }
  }

  class TrieNodeModel {
    constructor(char = "") {
      this.char = char;
      this.children = new Map();
      this.isEnd = false;
    }
  }

  class TrieStructure {
    constructor() {
      this.root = new TrieNodeModel();
    }
    frame(log, activeNode) {
      const positions = [];
      const edges = [];
      let counter = 0;
      const walk = (node, depth, parentPos) => {
        counter += 1;
        const x = counter * 45;
        const y = depth * 65 + 35;
        const pos = { x, y };
        positions.push({ id: node, value: node.char || "root", x, y, state: node === activeNode ? "active" : node.isEnd ? "success" : undefined });
        if (parentPos) edges.push({ from: parentPos, to: pos });
        node.children.forEach((child) => walk(child, depth + 1, pos));
      };
      walk(this.root, 0, null);
      return { positions, edges, log, statsDelta: { accesses: 1 } };
    }
    insert(word) {
      const frames = [];
      let node = this.root;
      for (const ch of word) {
        if (!node.children.has(ch)) node.children.set(ch, new TrieNodeModel(ch));
        node = node.children.get(ch);
        frames.push(this.frame(`Insert character '${ch}'`, node));
      }
      node.isEnd = true;
      frames.push(this.frame(`Marked end of word "${word}"`, node));
      return frames;
    }
  }

  /* ========================================================================
     13. GRAPH STRUCTURE & ALGORITHMS
     ======================================================================== */
  class GraphStructure {
    constructor(directed = false) {
      this.directed = directed;
      this.nodes = [];
      this.edges = [];
    }
    generateRandom(nodeCount = 6, edgeChance = 0.4, weighted = true, isDAG = false) {
      this.nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: i,
        label: String.fromCharCode(65 + i),
        x: 60 + (i % 3) * 200 + Utils.randomInt(-20, 20),
        y: 60 + Math.floor(i / 3) * 140 + Utils.randomInt(-15, 15),
      }));
      this.edges = [];

      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          if (Math.random() < edgeChance) {
            this.edges.push({ from: i, to: j, weight: weighted ? Utils.randomInt(1, 15) : 1 });
          }
        }
      }

      // Ensure connectivity via spanning chain
      for (let i = 1; i < nodeCount; i++) {
        const hasEdge = this.edges.some((e) => (e.from === i - 1 && e.to === i) || (!isDAG && e.from === i && e.to === i - 1));
        if (!hasEdge) {
          this.edges.push({ from: i - 1, to: i, weight: weighted ? Utils.randomInt(1, 15) : 1 });
        }
      }
    }
    adjacency() {
      const adj = new Map(this.nodes.map((n) => [n.id, []]));
      this.edges.forEach((e) => {
        adj.get(e.from).push({ to: e.to, weight: e.weight });
        if (!this.directed) adj.get(e.to).push({ to: e.from, weight: e.weight });
      });
      return adj;
    }
    frame(states = {}, edgeHighlights = [], log) {
      return {
        nodes: this.nodes.map((n) => ({ ...n, state: states[n.id] })),
        edges: this.edges.map((e) => ({
          ...e,
          highlighted: edgeHighlights.some((h) => (h[0] === e.from && h[1] === e.to) || (!this.directed && h[0] === e.to && h[1] === e.from)),
        })),
        directed: this.directed,
        log,
        statsDelta: { accesses: 1 },
      };
    }
  }

  class GraphAlgorithms {
    static bfs(graph, startId = 0) {
      const frames = [];
      const adj = graph.adjacency();
      const visited = new Set([startId]);
      const queue = [startId];
      const states = { [startId]: "current" };
      const mstEdges = [];

      frames.push(graph.frame(states, mstEdges, `Start BFS queue with node ${startId}`));

      while (queue.length) {
        const curr = queue.shift();
        states[curr] = "visited";
        frames.push(graph.frame({ ...states }, mstEdges, `Processing node ${curr}`));

        (adj.get(curr) || []).forEach(({ to }) => {
          if (!visited.has(to)) {
            visited.add(to);
            states[to] = "current";
            queue.push(to);
            mstEdges.push([curr, to]);
            frames.push(graph.frame({ ...states }, mstEdges, `Discover unvisited neighbor ${to} from ${curr}`));
          }
        });
      }
      frames.push(graph.frame(states, mstEdges, "BFS complete."));
      return frames;
    }

    static dfs(graph, startId = 0) {
      const frames = [];
      const adj = graph.adjacency();
      const visited = new Set();
      const states = {};
      const edgesUsed = [];

      const visit = (id, parent) => {
        visited.add(id);
        states[id] = "current";
        if (parent !== null) edgesUsed.push([parent, id]);
        frames.push(graph.frame({ ...states }, edgesUsed, `Visit node ${id}`));

        (adj.get(id) || []).forEach(({ to }) => {
          if (!visited.has(to)) {
            visit(to, id);
          }
        });
        states[id] = "visited";
        frames.push(graph.frame({ ...states }, edgesUsed, `Finished exploring node ${id}`));
      };

      visit(startId, null);
      frames.push(graph.frame(states, edgesUsed, "DFS complete."));
      return frames;
    }

    static dijkstra(graph, startId = 0) {
      const frames = [];
      const adj = graph.adjacency();
      const dist = new Map(graph.nodes.map((n) => [n.id, Infinity]));
      dist.set(startId, 0);
      const visited = new Set();
      const states = {};
      const activeEdges = [];

      while (visited.size < graph.nodes.length) {
        let u = null;
        let best = Infinity;
        dist.forEach((d, id) => {
          if (!visited.has(id) && d < best) {
            best = d;
            u = id;
          }
        });

        if (u === null) break;
        visited.add(u);
        states[u] = "visited";
        frames.push(graph.frame({ ...states }, activeEdges, `Finalize shortest path to node ${u} (dist = ${dist.get(u)})`));

        (adj.get(u) || []).forEach(({ to, weight }) => {
          if (!visited.has(to) && dist.get(u) + weight < dist.get(to)) {
            dist.set(to, dist.get(u) + weight);
            states[to] = "current";
            activeEdges.push([u, to]);
            frames.push(graph.frame({ ...states }, activeEdges, `Relax edge ${u} \u2192 ${to}: new dist = ${dist.get(to)}`));
          }
        });
      }
      frames.push(graph.frame(states, activeEdges, "Dijkstra complete."));
      return frames;
    }

    static bellmanFord(graph, startId = 0) {
      const frames = [];
      const dist = new Map(graph.nodes.map((n) => [n.id, Infinity]));
      dist.set(startId, 0);
      const edgesList = graph.directed ? graph.edges : graph.edges.flatMap((e) => [e, { from: e.to, to: e.from, weight: e.weight }]);
      const states = { [startId]: "current" };
      const relaxedEdges = [];

      for (let i = 0; i < graph.nodes.length - 1; i++) {
        edgesList.forEach((e) => {
          if (dist.get(e.from) !== Infinity && dist.get(e.from) + e.weight < dist.get(e.to)) {
            dist.set(e.to, dist.get(e.from) + e.weight);
            states[e.to] = "current";
            relaxedEdges.push([e.from, e.to]);
            frames.push(graph.frame({ ...states }, relaxedEdges, `Iteration ${i + 1}: relax edge ${e.from}\u2192${e.to}, dist=${dist.get(e.to)}`));
          }
        });
      }
      frames.push(graph.frame(states, relaxedEdges, "Bellman-Ford complete."));
      return frames;
    }

    static floydWarshall(graph) {
      const frames = [];
      const n = graph.nodes.length;
      const ids = graph.nodes.map((n2) => n2.id);
      const labels = graph.nodes.map((n2) => n2.label);
      const dist = Array.from({ length: n }, () => new Array(n).fill(Infinity));
      for (let i = 0; i < n; i++) dist[i][i] = 0;

      graph.edges.forEach((e) => {
        const i = ids.indexOf(e.from);
        const j = ids.indexOf(e.to);
        if (i !== -1 && j !== -1) {
          dist[i][j] = e.weight;
          if (!graph.directed) dist[j][i] = e.weight;
        }
      });

      frames.push({
        table: dist.map((r) => r.map((v) => (v === Infinity ? "\u221E" : v))),
        rowLabels: labels,
        colLabels: labels,
        log: "Initial Floyd-Warshall distance matrix",
      });

      for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (dist[i][k] !== Infinity && dist[k][j] !== Infinity && dist[i][k] + dist[k][j] < dist[i][j]) {
              dist[i][j] = dist[i][k] + dist[k][j];
              frames.push({
                table: dist.map((r) => r.map((v) => (v === Infinity ? "\u221E" : v))),
                rowLabels: labels,
                colLabels: labels,
                activeCell: [i, j],
                log: `Updated dist[${labels[i]}][${labels[j]}] = ${dist[i][j]} via intermediate node ${labels[k]}`,
                statsDelta: { comparisons: 1 },
              });
            }
          }
        }
      }
      return frames;
    }

    static primMST(graph) {
      const frames = [];
      const adj = graph.adjacency();
      const inMST = new Set();
      const start = graph.nodes[0]?.id ?? 0;
      inMST.add(start);
      const states = { [start]: "visited" };
      const mstEdges = [];

      frames.push(graph.frame({ ...states }, mstEdges, `Start Prim's MST with initial node ${start}`));

      while (inMST.size < graph.nodes.length) {
        let best = null;
        inMST.forEach((u) => {
          (adj.get(u) || []).forEach(({ to, weight }) => {
            if (!inMST.has(to) && (!best || weight < best.weight)) {
              best = { from: u, to, weight };
            }
          });
        });

        if (!best) break;
        inMST.add(best.to);
        states[best.to] = "visited";
        mstEdges.push([best.from, best.to]);
        frames.push(graph.frame({ ...states }, mstEdges, `Add minimum edge ${best.from}\u2192${best.to} (w=${best.weight}) into MST`));
      }
      frames.push(graph.frame(states, mstEdges, "Prim's MST complete."));
      return frames;
    }

    static kruskalMST(graph) {
      const frames = [];
      const parent = new Map(graph.nodes.map((n) => [n.id, n.id]));
      const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
      const union = (a, b) => parent.set(find(a), find(b));
      const sortedEdges = graph.edges.slice().sort((a, b) => a.weight - b.weight);
      const mstEdges = [];
      const states = {};

      sortedEdges.forEach((e) => {
        frames.push(graph.frame(states, mstEdges, `Inspect edge ${e.from}\u2192${e.to} (weight = ${e.weight})`));
        if (find(e.from) !== find(e.to)) {
          union(e.from, e.to);
          mstEdges.push([e.from, e.to]);
          states[e.from] = "visited";
          states[e.to] = "visited";
          frames.push(graph.frame({ ...states }, mstEdges, `Accepted edge ${e.from}\u2192${e.to} into MST (no cycle)`));
        }
      });
      frames.push(graph.frame(states, mstEdges, "Kruskal's MST complete."));
      return frames;
    }

    static topologicalSort(graph) {
      const frames = [];
      const adj = graph.adjacency();
      const visited = new Set();
      const order = [];
      const states = {};

      const visit = (id) => {
        visited.add(id);
        states[id] = "current";
        frames.push(graph.frame({ ...states }, [], `Visit node ${id}`));

        (adj.get(id) || []).forEach(({ to }) => {
          if (!visited.has(to)) visit(to);
        });

        states[id] = "visited";
        order.unshift(graph.nodes.find((n) => n.id === id)?.label || id);
        frames.push(graph.frame({ ...states }, [], `Completed node ${id} \u2192 prepend to topological ordering`));
      };

      graph.nodes.forEach((n) => {
        if (!visited.has(n.id)) visit(n.id);
      });

      frames.push(graph.frame(states, [], `Topological Order: ${order.join(" \u2192 ")}`));
      return frames;
    }
  }

  /* ========================================================================
     14. DYNAMIC PROGRAMMING
     ======================================================================== */
  class DPAlgorithms {
    static fibonacci(n = 8) {
      const frames = [];
      const dp = new Array(n + 1).fill(null);
      dp[0] = 0;
      frames.push({ table: [dp.slice()], rowLabels: ["fib(i)"], colLabels: dp.map((_, i) => i), activeCell: [0, 0], line: 0, log: "Base case fib(0) = 0" });

      if (n >= 1) {
        dp[1] = 1;
        frames.push({ table: [dp.slice()], rowLabels: ["fib(i)"], colLabels: dp.map((_, i) => i), activeCell: [0, 1], line: 0, log: "Base case fib(1) = 1" });
      }

      for (let i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
        frames.push({
          table: [dp.slice()],
          rowLabels: ["fib(i)"],
          colLabels: dp.map((_, idx) => idx),
          activeCell: [0, i],
          line: 2,
          log: `fib(${i}) = fib(${i - 1}) + fib(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`,
          statsDelta: { accesses: 2 },
        });
      }
      return frames;
    }

    static coinChange(coins = [1, 2, 5], amount = 10) {
      const frames = [];
      const dp = new Array(amount + 1).fill(Infinity);
      dp[0] = 0;

      frames.push({
        table: [dp.map((v) => (v === Infinity ? "\u221E" : v))],
        rowLabels: ["minCoins"],
        colLabels: dp.map((_, i) => i),
        activeCell: [0, 0],
        line: 1,
        log: "Base case dp[0] = 0 (0 coins for amount 0)",
      });

      for (let a = 1; a <= amount; a++) {
        coins.forEach((coin) => {
          if (coin <= a && dp[a - coin] + 1 < dp[a]) {
            dp[a] = dp[a - coin] + 1;
            frames.push({
              table: [dp.map((v) => (v === Infinity ? "\u221E" : v))],
              rowLabels: ["minCoins"],
              colLabels: dp.map((_, i) => i),
              activeCell: [0, a],
              line: 4,
              log: `Use coin ${coin}: dp[${a}] = min(dp[${a}], dp[${a - coin}] + 1) = ${dp[a]}`,
              statsDelta: { comparisons: 1 },
            });
          }
        });
      }
      return frames;
    }

    static knapsack(weights = [2, 3, 4, 5], values = [3, 4, 5, 6], capacity = 5) {
      const frames = [];
      const n = weights.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

      for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= capacity; w++) {
          if (weights[i - 1] <= w) {
            dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
          } else {
            dp[i][w] = dp[i - 1][w];
          }
          frames.push({
            table: dp.map((r) => r.slice()),
            rowLabels: dp.map((_, r) => (r === 0 ? "init" : `item ${r} (w=${weights[r - 1]}, v=${values[r - 1]})`)),
            colLabels: Array.from({ length: capacity + 1 }, (_, c) => `cap ${c}`),
            activeCell: [i, w],
            line: 3,
            log: `dp[item ${i}][cap ${w}] = ${dp[i][w]}`,
            statsDelta: { comparisons: 1 },
          });
        }
      }
      return frames;
    }

    static lcs(strA = "ABCDGH", strB = "AEDFHR") {
      const frames = [];
      const n = strA.length, m = strB.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (strA[i - 1] === strB[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
          frames.push({
            table: dp.map((r) => r.slice()),
            rowLabels: ["\u2205", ...strA.split("")],
            colLabels: ["\u2205", ...strB.split("")],
            activeCell: [i, j],
            line: 2,
            log: strA[i - 1] === strB[j - 1] ? `Match '${strA[i - 1]}': dp[${i}][${j}] = ${dp[i][j]}` : `Mismatch: dp[${i}][${j}] = max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}`,
            statsDelta: { comparisons: 1 },
          });
        }
      }
      return frames;
    }
  }

  /* ========================================================================
     15. BACKTRACKING
     ======================================================================== */
  class BacktrackingAlgorithms {
    static nQueens(n = 6) {
      const frames = [];
      const board = Array.from({ length: n }, () => new Array(n).fill(0));

      const isSafe = (row, col) => {
        for (let i = 0; i < row; i++) {
          if (board[i][col]) return false;
          const d1 = col - (row - i);
          const d2 = col + (row - i);
          if (d1 >= 0 && board[i][d1]) return false;
          if (d2 < n && board[i][d2]) return false;
        }
        return true;
      };

      const solve = (row) => {
        if (row === n) {
          frames.push({ grid: board.map((r) => r.slice()), line: 1, log: "All queens placed safely!", logLevel: "success" });
          return true;
        }
        for (let col = 0; col < n; col++) {
          frames.push({ grid: board.map((r) => r.slice()), activeCell: [row, col], line: 3, log: `Try placing queen at row ${row}, col ${col}` });
          if (isSafe(row, col)) {
            board[row][col] = "\u265B";
            frames.push({ grid: board.map((r) => r.slice()), activeCell: [row, col], line: 4, log: `Placed queen at (${row}, ${col})` });
            if (solve(row + 1)) return true;
            board[row][col] = 0;
            frames.push({ grid: board.map((r) => r.slice()), activeCell: [row, col], line: 6, log: `Conflict: Backtrack from (${row}, ${col})`, logLevel: "error" });
          }
        }
        return false;
      };

      solve(0);
      return frames;
    }

    static ratInMaze(maze) {
      const defaultMaze = maze || [
        [1, 0, 0, 0],
        [1, 1, 0, 1],
        [0, 1, 0, 0],
        [1, 1, 1, 1],
      ];
      const frames = [];
      const n = defaultMaze.length;
      const gridState = defaultMaze.map((row) => row.map((c) => (c === 0 ? "#" : ".")));

      const isSafe = (x, y) => x >= 0 && y >= 0 && x < n && y < n && defaultMaze[x][y] === 1 && gridState[x][y] !== "\u{1F400}" && gridState[x][y] !== "x";

      const solve = (x, y) => {
        if (x === n - 1 && y === n - 1 && isSafe(x, y)) {
          gridState[x][y] = "\u{1F400}";
          frames.push({ grid: gridState.map((r) => r.slice()), activeCell: [x, y], line: 1, log: "Reached destination exit!", logLevel: "success" });
          return true;
        }
        if (!isSafe(x, y)) return false;

        gridState[x][y] = "\u{1F400}";
        frames.push({ grid: gridState.map((r) => r.slice()), activeCell: [x, y], line: 3, log: `Rat moves to cell (${x}, ${y})` });

        const moves = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        for (const [dx, dy] of moves) {
          if (solve(x + dx, y + dy)) return true;
        }

        gridState[x][y] = "x";
        frames.push({ grid: gridState.map((r) => r.slice()), activeCell: [x, y], line: 6, log: `Dead end: Backtrack from (${x}, ${y})`, logLevel: "error" });
        return false;
      };

      solve(0, 0);
      return frames;
    }

    static sudokuSolver(grid) {
      const defaultPuzzle = grid || [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ];
      const frames = [];
      const board = defaultPuzzle.map((r) => r.slice());
      const n = 9;

      const isValid = (row, col, val) => {
        for (let i = 0; i < n; i++) {
          if (board[row][i] === val || board[i][col] === val) return false;
        }
        const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
        for (let i = br; i < br + 3; i++) {
          for (let j = bc; j < bc + 3; j++) {
            if (board[i][j] === val) return false;
          }
        }
        return true;
      };

      let count = 0;
      const solve = () => {
        if (count > 250) return true; // Safety threshold for fast, responsive animation
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (board[r][c] === 0) {
              for (let val = 1; val <= 9; val++) {
                if (isValid(r, c, val)) {
                  board[r][c] = val;
                  count++;
                  frames.push({ grid: board.map((row) => row.slice()), activeCell: [r, c], line: 4, log: `Place ${val} at cell (${r}, ${c})` });
                  if (solve()) return true;
                  board[r][c] = 0;
                  frames.push({ grid: board.map((row) => row.slice()), activeCell: [r, c], line: 6, log: `Backtrack from cell (${r}, ${c})`, logLevel: "error" });
                }
              }
              return false;
            }
          }
        }
        return true;
      };

      solve();
      return frames;
    }
  }

  /* ========================================================================
     16. THEME MANAGER
     ======================================================================== */
  class ThemeManager {
    constructor(toggleBtn) {
      this.toggleBtn = toggleBtn;
      this.theme = localStorage.getItem("dsa-theme") || "dark";
      this._apply();
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener("click", () => this.toggle());
      }
    }
    _apply() {
      document.documentElement.setAttribute("data-theme", this.theme);
      if (this.toggleBtn) this.toggleBtn.setAttribute("aria-pressed", String(this.theme === "light"));
    }
    toggle() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("dsa-theme", this.theme);
      } catch (err) {
        console.warn("Unable to persist theme preference:", err);
      }
      this._apply();
    }
  }

  /* ========================================================================
     17. MAIN APPLICATION ORCHESTRATOR
     ======================================================================== */
  class DSAVisualizerApp {
    constructor() {
      this.dom = this._cacheDom();
      this.stats = new StatsManager(this.dom);
      this.logger = new Logger(this.dom.executionLogList);
      this.pseudocode = new PseudocodeManager(this.dom.pseudocodeContent);
      this.infoPanel = new InfoPanelManager(this.dom);
      this.engine = new AnimationEngine({ stats: this.stats, logger: this.logger, pseudocode: this.pseudocode });
      this.theme = new ThemeManager(this.dom.themeToggleBtn);

      this.currentArray = Utils.randomArray(18, 5, 100);
      this.currentSection = "dashboard";
      this.currentAlgoKey = "sort-bubble";

      this.graph = new GraphStructure(false);
      this.bst = new BSTStructure();
      this.avl = new AVLStructure();
      this.heap = new HeapStructure(true);
      this.trie = new TrieStructure();
      this.hashTable = new HashTableStructure(8);
      this.stack = new LinearStructure("stack");
      this.queue = new LinearStructure("queue");
      this.linkedList = new LinkedListStructure(false);

      this._bindSidebar();
      this._bindControlPanel();
      this._bindKeyboardShortcuts();
      this._bindExportImport();

      this._renderInfo(DEFAULT_META);
      this._loadSection("dashboard");
    }

    _cacheDom() {
      return {
        sidebarLinks: Utils.$all(".sidebar-link"),
        algorithmTitle: Utils.$("#algorithm-title"),
        algorithmDescription: Utils.$("#algorithm-description"),
        visualizationCanvas: Utils.$("#visualization-canvas"),
        animationArea: Utils.$("#animation-area"),
        statComparisons: Utils.$("#stat-comparisons"),
        statSwaps: Utils.$("#stat-swaps"),
        statAccesses: Utils.$("#stat-accesses"),
        statTime: Utils.$("#stat-time"),
        statCurrentStep: Utils.$("#stat-current-step"),
        complexityTime: Utils.$("#complexity-time"),
        complexitySpace: Utils.$("#complexity-space"),
        pseudocodeContent: Utils.$("#pseudocode-content"),
        executionLogList: Utils.$("#execution-log-list"),
        infoTimeComplexity: Utils.$("#info-time-complexity"),
        infoSpaceComplexity: Utils.$("#info-space-complexity"),
        infoBestCase: Utils.$("#info-best-case"),
        infoAverageCase: Utils.$("#info-average-case"),
        infoWorstCase: Utils.$("#info-worst-case"),
        infoAdvantages: Utils.$("#info-advantages"),
        infoDisadvantages: Utils.$("#info-disadvantages"),
        infoApplications: Utils.$("#info-applications"),
        playBtn: Utils.$("#play-btn"),
        pauseBtn: Utils.$("#pause-btn"),
        sortingSelect: Utils.$("#sorting-select"),
        searchSelect: Utils.$("#search-select"),
        resetBtn: Utils.$("#reset-btn"),
        nextStepBtn: Utils.$("#next-step-btn"),
        prevStepBtn: Utils.$("#prev-step-btn"),
        speedSlider: Utils.$("#speed-slider"),
        arraySizeSlider: Utils.$("#array-size-slider"),
        dataInput: Utils.$("#data-input"),
        generateRandomBtn: Utils.$("#generate-random-btn"),
        startVisualizationBtn: Utils.$("#start-visualization-btn"),
        themeToggleBtn: Utils.$("#theme-toggle-btn"),
        mobileMenuBtn: Utils.$("#mobile-menu-toggle"),
        sidebar: Utils.$("#main-sidebar") || Utils.$(".app-sidebar"),
        headerSearchInput: Utils.$("#search-input"),
      };
    }

    _renderInfo(meta) {
      this.infoPanel.update(meta);
      this.pseudocode.setCode(meta.pseudocode);
    }

    _bindSidebar() {
      if (this.dom.mobileMenuBtn && this.dom.sidebar) {
        this.dom.mobileMenuBtn.addEventListener("click", () => {
          this.dom.sidebar.classList.toggle("is-open");
        });
      }

      if (this.dom.headerSearchInput) {
        this.dom.headerSearchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const q = this.dom.headerSearchInput.value.toLowerCase().trim();
            if (!q) return;
            const targetLink = this.dom.sidebarLinks.find((l) =>
              l.textContent.toLowerCase().includes(q) || l.dataset.section?.toLowerCase().includes(q)
            );
            if (targetLink) {
              targetLink.click();
            }
          }
        });
      }

      this.dom.sidebarLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.dom.sidebarLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
          const section = link.dataset.section;
          this._loadSection(section);
          if (this.dom.sidebar) {
            this.dom.sidebar.classList.remove("is-open");
          }
        });
      });
    }

    _updateControlSelectOptions(section) {
      const select = this.dom.sortingSelect;
      if (!select) return;

      const sectionOptions = {
        sorting: [
          { value: "sort-bubble", label: "Bubble Sort" },
          { value: "sort-selection", label: "Selection Sort" },
          { value: "sort-insertion", label: "Insertion Sort" },
          { value: "sort-merge", label: "Merge Sort" },
          { value: "sort-quick", label: "Quick Sort" },
          { value: "sort-heap", label: "Heap Sort" },
          { value: "sort-shell", label: "Shell Sort" },
          { value: "sort-counting", label: "Counting Sort" },
          { value: "sort-radix", label: "Radix Sort" },
        ],
        searching: [
          { value: "search-linear", label: "Linear Search" },
          { value: "search-binary", label: "Binary Search" },
          { value: "search-jump", label: "Jump Search" },
          { value: "search-interpolation", label: "Interpolation Search" },
        ],
        graphs: [
          { value: "graph-bfs", label: "Breadth-First Search (BFS)" },
          { value: "graph-dfs", label: "Depth-First Search (DFS)" },
          { value: "graph-dijkstra", label: "Dijkstra's Shortest Path" },
          { value: "graph-bellmanford", label: "Bellman-Ford Algorithm" },
          { value: "graph-floydwarshall", label: "Floyd-Warshall (All Pairs)" },
          { value: "graph-prim", label: "Prim's MST" },
          { value: "graph-kruskal", label: "Kruskal's MST" },
          { value: "graph-toposort", label: "Topological Sort (DAG)" },
        ],
        trees: [
          { value: "tree-bst", label: "Binary Search Tree (BST)" },
          { value: "tree-avl", label: "AVL Tree (Balanced)" },
        ],
        heap: [
          { value: "heap", label: "Max Binary Heap" },
        ],
        trie: [
          { value: "trie", label: "Trie (Prefix Tree)" },
        ],
        hashing: [
          { value: "hashing", label: "Hash Table (Chaining)" },
        ],
        stack: [
          { value: "linear-stack", label: "Stack (Push / Pop)" },
        ],
        queue: [
          { value: "linear-queue", label: "Queue (FIFO)" },
        ],
        "linked-list": [
          { value: "linked-list", label: "Singly Linked List" },
        ],
        "dynamic-programming": [
          { value: "dp-fibonacci", label: "Fibonacci (DP)" },
          { value: "dp-coinchange", label: "Coin Change" },
          { value: "dp-knapsack", label: "0/1 Knapsack" },
          { value: "dp-lcs", label: "Longest Common Subsequence" },
        ],
        backtracking: [
          { value: "backtrack-nqueens", label: "N-Queens" },
          { value: "backtrack-ratmaze", label: "Rat in a Maze" },
          { value: "backtrack-sudoku", label: "Sudoku Solver" },
        ],
      };

      const options = sectionOptions[section] || sectionOptions.sorting;
      select.innerHTML = "";
      options.forEach((opt) => {
        const optionEl = document.createElement("option");
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        select.appendChild(optionEl);
      });

      if (options.length > 0) {
        select.value = options[0].value;
        this.currentAlgoKey = options[0].value;
      }
    }

    _loadSection(section) {
      this.currentSection = section;
      this.engine.pause();
      const canvas = this.dom.visualizationCanvas;
      if (!canvas) return;

      this._updateControlSelectOptions(section);

      const sectionHandlers = {
        dashboard: () => {
          this._renderInfo({
            ...DEFAULT_META,
            title: "DSA Interactive Visualizer",
            description: "Select an algorithm or data structure from the sidebar. Use the control panel below to play, pause, step through operations, or supply custom inputs.",
          });
          canvas.innerHTML = "";
          canvas.appendChild(Utils.createEl("p", "placeholder-text", "Choose a topic from the sidebar to begin visualizing."));
        },
        arrays: () => this._activateSort("sort-bubble"),
        sorting: () => {
          const key = this.dom.sortingSelect ? this.dom.sortingSelect.value : "sort-bubble";
          this._activateSort(key);
        },
        searching: () => {
          const key = this.dom.sortingSelect ? this.dom.sortingSelect.value : "search-linear";
          this._activateSearch(key);
        },
        stack: () => this._activateLinear("stack"),
        queue: () => this._activateLinear("queue"),
        "linked-list": () => this._activateLinkedList(),
        hashing: () => this._activateHashing(),
        trees: () => {
          const key = this.dom.sortingSelect?.value || "tree-bst";
          this._activateTree(key === "tree-avl" ? "avl" : "bst");
        },
        heap: () => this._activateHeap(),
        trie: () => this._activateTrie(),
        graphs: () => {
          const key = this.dom.sortingSelect?.value || "graph-bfs";
          this._activateGraph(key.replace("graph-", ""));
        },
        "dynamic-programming": () => {
          const key = this.dom.sortingSelect?.value || "dp-fibonacci";
          this._activateDP(key.replace("dp-", ""));
        },
        backtracking: () => {
          const key = this.dom.sortingSelect?.value || "backtrack-nqueens";
          this._activateBacktracking(key.replace("backtrack-", ""));
        },
        settings: () => {
          this._renderInfo({
            ...DEFAULT_META,
            title: "Settings & Options",
            description: "Toggle themes and adjust playback speed or dataset sizes via the control panel at the bottom.",
          });
          canvas.innerHTML = "";
          canvas.appendChild(Utils.createEl("p", "placeholder-text", "Use controls below to customize speed, size, and theme."));
        },
      };

      (sectionHandlers[section] || sectionHandlers.dashboard)();
    }

    _activateSort(algoKey) {
      this.currentAlgoKey = algoKey;
      this._renderInfo(ALGORITHM_METADATA[algoKey] || DEFAULT_META);
      const renderer = new ArrayRenderer(this.dom.visualizationCanvas);
      const initialFrame = { array: this.currentArray, compared: [], swapped: [], sorted: [] };
      renderer.render(initialFrame);
      this.engine.load([], (frame) => renderer.render(frame), initialFrame);
      this._pendingSortRenderer = renderer;
    }

    _runSort(algoKey) {
      const map = {
        "sort-bubble": (arr) => SortingAlgorithms.bubbleSort(arr),
        "sort-selection": (arr) => SortingAlgorithms.selectionSort(arr),
        "sort-insertion": (arr) => SortingAlgorithms.insertionSort(arr),
        "sort-merge": (arr) => SortingAlgorithms.mergeSort(arr),
        "sort-quick": (arr) => SortingAlgorithms.quickSort(arr),
        "sort-heap": (arr) => SortingAlgorithms.heapSort(arr),
        "sort-shell": (arr) => SortingAlgorithms.shellSort(arr),
        "sort-counting": (arr) => SortingAlgorithms.countingSort(arr),
        "sort-radix": (arr) => SortingAlgorithms.radixSort(arr),
      };

      const fn = map[algoKey] || map["sort-bubble"];
      const frames = fn(this.currentArray);
      const renderer = new ArrayRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA[algoKey] || DEFAULT_META);
      const initialFrame = { array: this.currentArray, compared: [], swapped: [], sorted: [] };
      this.engine.load(frames, (frame) => renderer.render(frame), initialFrame);
      renderer.render(initialFrame);
      this.engine.play();
    }

    _activateSearch(algoKey) {
      this.currentAlgoKey = algoKey;
      this._renderInfo(ALGORITHM_METADATA[algoKey] || DEFAULT_META);
      const renderer = new ArrayRenderer(this.dom.visualizationCanvas);
      const sortedArray = this.currentArray.slice().sort((a, b) => a - b);
      const displayArr = algoKey === "search-linear" ? this.currentArray : sortedArray;
      const initialFrame = { array: displayArr, compared: [], swapped: [], sorted: [] };
      renderer.render(initialFrame);
      this.engine.load([], (frame) => renderer.render(frame), initialFrame);
    }

    _runSearch(algoKey, target) {
      const map = {
        "search-linear": (arr, t) => SearchingAlgorithms.linearSearch(arr, t),
        "search-binary": (arr, t) => SearchingAlgorithms.binarySearch(arr, t),
        "search-jump": (arr, t) => SearchingAlgorithms.jumpSearch(arr, t),
        "search-interpolation": (arr, t) => SearchingAlgorithms.interpolationSearch(arr, t),
      };

      const fn = map[algoKey] || map["search-linear"];
      const sortedArray = this.currentArray.slice().sort((a, b) => a - b);
      const activeArr = algoKey === "search-linear" ? this.currentArray : sortedArray;
      const frames = fn(activeArr, target);
      const renderer = new ArrayRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA[algoKey] || DEFAULT_META);
      const initialFrame = { array: activeArr, compared: [], swapped: [], sorted: [] };
      this.engine.load(frames, (frame) => renderer.render(frame), initialFrame);
      renderer.render(initialFrame);
      this.engine.play();
    }

    _activateLinear(kind) {
      this.currentAlgoKey = `linear-${kind}`;
      const structure = kind === "queue" ? this.queue : this.stack;
      const renderer = new LinearRenderer(this.dom.visualizationCanvas, kind === "stack" ? "column" : "row");
      this._renderInfo(ALGORITHM_METADATA[`linear-${kind}`] || DEFAULT_META);
      const initialFrame = { items: structure.items, blockClass: kind === "stack" ? "stack-block" : "queue-block" };
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeLinearStructure = structure;
      this._activeLinearRenderer = renderer;
    }

    _activateLinkedList() {
      this.currentAlgoKey = "linked-list";
      const renderer = new LinkedListRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA["linked-list"] || DEFAULT_META);
      const initialFrame = { nodes: this.linkedList.items, doubly: false };
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeLinkedRenderer = renderer;
    }

    _activateHashing() {
      this.currentAlgoKey = "hashing";
      const renderer = new HashTableRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA["hashing"] || DEFAULT_META);
      const initialFrame = { buckets: this.hashTable.buckets };
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeHashRenderer = renderer;
    }

    _activateTree(kind) {
      this.currentAlgoKey = `tree-${kind}`;
      const renderer = new TreeRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA[`tree-${kind}`] || DEFAULT_META);
      const structure = kind === "avl" ? this.avl : this.bst;
      const initialFrame = structure.frame("Tree Ready.");
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeTreeRenderer = renderer;
      this._activeTreeStructure = structure;
    }

    _activateHeap() {
      this.currentAlgoKey = "heap";
      const renderer = new TreeRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA["heap"] || DEFAULT_META);
      const initialFrame = this.heap.frame([], "Heap ready.");
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeHeapRenderer = renderer;
    }

    _activateTrie() {
      this.currentAlgoKey = "trie";
      const renderer = new TrieRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA["trie"] || DEFAULT_META);
      const initialFrame = this.trie.frame("Trie ready.");
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeTrieRenderer = renderer;
    }

    _activateGraph(algoKey = "bfs") {
      this.currentAlgoKey = `graph-${algoKey}`;
      const isDAG = algoKey === "toposort";
      if (this.graph.nodes.length === 0 || this.graph.directed !== isDAG) {
        this.graph = new GraphStructure(isDAG);
        this.graph.generateRandom(6, 0.4, true, isDAG);
      }
      const renderer = new GraphRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA[`graph-${algoKey}`] || DEFAULT_META);
      const initialFrame = this.graph.frame();
      renderer.render(initialFrame);
      this.engine.load([], (f) => renderer.render(f), initialFrame);
      this._activeGraphRenderer = renderer;
    }

    _runGraphAlgorithm(algoKey) {
      const isDAG = algoKey === "toposort";
      if (this.graph.nodes.length === 0 || this.graph.directed !== isDAG) {
        this.graph = new GraphStructure(isDAG);
        this.graph.generateRandom(6, 0.4, true, isDAG);
      }

      if (algoKey === "floydwarshall") {
        const frames = GraphAlgorithms.floydWarshall(this.graph);
        const renderer = new TableRenderer(this.dom.visualizationCanvas);
        this.engine.load(frames, (f) => renderer.render(f));
        if (frames.length) renderer.render(frames[0]);
        this.engine.play();
        return;
      }

      const map = {
        bfs: () => GraphAlgorithms.bfs(this.graph, this.graph.nodes[0]?.id ?? 0),
        dfs: () => GraphAlgorithms.dfs(this.graph, this.graph.nodes[0]?.id ?? 0),
        dijkstra: () => GraphAlgorithms.dijkstra(this.graph, this.graph.nodes[0]?.id ?? 0),
        bellmanford: () => GraphAlgorithms.bellmanFord(this.graph, this.graph.nodes[0]?.id ?? 0),
        prim: () => GraphAlgorithms.primMST(this.graph),
        kruskal: () => GraphAlgorithms.kruskalMST(this.graph),
        toposort: () => GraphAlgorithms.topologicalSort(this.graph),
      };

      const fn = map[algoKey] || map.bfs;
      const frames = fn();
      const renderer = new GraphRenderer(this.dom.visualizationCanvas);
      this._renderInfo(ALGORITHM_METADATA[`graph-${algoKey}`] || DEFAULT_META);
      const initialFrame = this.graph.frame();
      this.engine.load(frames, (f) => renderer.render(f), initialFrame);
      renderer.render(initialFrame);
      this.engine.play();
    }

    _activateDP(kind = "fibonacci") {
      this.currentAlgoKey = `dp-${kind}`;
      this._renderInfo(ALGORITHM_METADATA[`dp-${kind}`] || DEFAULT_META);
      const renderer = new TableRenderer(this.dom.visualizationCanvas);
      let frames = [];

      if (kind === "fibonacci") frames = DPAlgorithms.fibonacci(8);
      else if (kind === "coinchange") frames = DPAlgorithms.coinChange([1, 2, 5], 10);
      else if (kind === "knapsack") frames = DPAlgorithms.knapsack([2, 3, 4, 5], [3, 4, 5, 6], 5);
      else if (kind === "lcs") frames = DPAlgorithms.lcs("ABCDGH", "AEDFHR");

      this.engine.load(frames, (f) => renderer.render(f));
      if (frames.length) renderer.render(frames[0]);
    }

    _activateBacktracking(kind = "nqueens") {
      this.currentAlgoKey = `backtrack-${kind}`;
      this._renderInfo(ALGORITHM_METADATA[`backtrack-${kind}`] || DEFAULT_META);
      const renderer = new GridRenderer(this.dom.visualizationCanvas);
      let frames = [];

      if (kind === "nqueens") frames = BacktrackingAlgorithms.nQueens(6);
      else if (kind === "ratmaze") frames = BacktrackingAlgorithms.ratInMaze();
      else if (kind === "sudoku") frames = BacktrackingAlgorithms.sudokuSolver();

      this.engine.load(frames, (f) => renderer.render(f));
      if (frames.length) renderer.render(frames[0]);
    }

    _bindControlPanel() {
      const d = this.dom;
      if (d.playBtn) d.playBtn.addEventListener("click", () => this.engine.play());
      if (d.pauseBtn) d.pauseBtn.addEventListener("click", () => this.engine.pause());
      if (d.resetBtn) d.resetBtn.addEventListener("click", () => this._resetVisualization());
      if (d.nextStepBtn) d.nextStepBtn.addEventListener("click", () => this.engine.stepForward());
      if (d.prevStepBtn) d.prevStepBtn.addEventListener("click", () => this.engine.stepBackward());
      if (d.speedSlider) d.speedSlider.addEventListener("input", (e) => this.engine.setSpeed(e.target.value));

      if (d.arraySizeSlider) {
        d.arraySizeSlider.addEventListener(
          "input",
          Utils.debounce((e) => {
            const size = Utils.clamp(Number(e.target.value) || 18, 5, 100);
            this.currentArray = Utils.randomArray(size, 5, 100);
            this._reRenderCurrentArray();
          }, 250)
        );
      }

      if (d.generateRandomBtn) d.generateRandomBtn.addEventListener("click", () => this._generateRandomData());
      if (d.startVisualizationBtn) d.startVisualizationBtn.addEventListener("click", () => this._startVisualization());

      if (d.sortingSelect) {
        d.sortingSelect.addEventListener("change", (e) => {
          this.currentAlgoKey = e.target.value;
          const val = e.target.value;
          if (val.startsWith("sort-")) this._activateSort(val);
          else if (val.startsWith("search-")) this._activateSearch(val);
          else if (val.startsWith("graph-")) this._activateGraph(val.replace("graph-", ""));
          else if (val.startsWith("tree-")) this._activateTree(val.replace("tree-", ""));
          else if (val.startsWith("dp-")) this._activateDP(val.replace("dp-", ""));
          else if (val.startsWith("backtrack-")) this._activateBacktracking(val.replace("backtrack-", ""));
          else if (val.startsWith("linear-")) this._activateLinear(val.replace("linear-", ""));
          else if (val === "heap") this._activateHeap();
          else if (val === "trie") this._activateTrie();
          else if (val === "hashing") this._activateHashing();
          else if (val === "linked-list") this._activateLinkedList();
        });
      }
    }

    _resetVisualization() {
      this.engine.reset();
      this._loadSection(this.currentSection);
    }

    _reRenderCurrentArray() {
      if (this._pendingSortRenderer && (this.currentSection === "sorting" || this.currentSection === "arrays")) {
        this._pendingSortRenderer.render({ array: this.currentArray, compared: [], swapped: [], sorted: [] });
      }
    }

    _generateRandomData() {
      const size = this.dom.arraySizeSlider ? Number(this.dom.arraySizeSlider.value) : 18;
      this.currentArray = Utils.randomArray(size, 5, 100);

      if (this.currentSection === "graphs") {
        const isDAG = this.currentAlgoKey === "graph-toposort";
        this.graph = new GraphStructure(isDAG);
        this.graph.generateRandom(6, 0.4, true, isDAG);
        if (this._activeGraphRenderer) this._activeGraphRenderer.render(this.graph.frame());
      } else {
        this._reRenderCurrentArray();
      }
      this.logger.log("Generated fresh random dataset.");
    }

    _startVisualization() {
      const rawInput = this.dom.dataInput ? this.dom.dataInput.value.trim() : "";
      const customNums = Utils.parseCustomArray(rawInput);

      let key = this.dom.sortingSelect?.value || this.currentAlgoKey || "sort-bubble";

      // 1. SORTING
      if (key.startsWith("sort-") || this.currentSection === "sorting" || this.currentSection === "arrays") {
        if (customNums && customNums.length) this.currentArray = customNums;
        this._runSort(key);
        return;
      }

      // 2. SEARCHING
      if (key.startsWith("search-") || this.currentSection === "searching") {
        let target;
        if (customNums && customNums.length === 1) {
          target = customNums[0];
        } else if (customNums && customNums.length > 1) {
          this.currentArray = customNums;
          target = customNums[0];
        } else {
          target = this.currentArray[Utils.randomInt(0, this.currentArray.length - 1)];
        }
        this._runSearch(key, target);
        return;
      }

      // 3. TREES & AVL
      if (key.startsWith("tree-") || this.currentSection === "trees") {
        const structure = key === "tree-avl" ? this.avl : this.bst;
        structure.root = null;
        const values = customNums && customNums.length ? customNums : Utils.randomArray(6, 10, 99);
        const frames = values.flatMap((v) => structure.insert(v));
        const renderer = this._activeTreeRenderer || new TreeRenderer(this.dom.visualizationCanvas);
        const initialFrame = { positions: [], edges: [], log: "Tree ready." };
        this.engine.load(frames, (f) => renderer.render(f), initialFrame);
        renderer.render(initialFrame);
        this.engine.play();
        return;
      }

      // 4. HEAP
      if (key === "heap" || this.currentSection === "heap") {
        this.heap.items = [];
        const values = customNums && customNums.length ? customNums : Utils.randomArray(6, 10, 99);
        const frames = values.flatMap((v) => this.heap.insert(v));
        const renderer = this._activeHeapRenderer || new TreeRenderer(this.dom.visualizationCanvas);
        const initialFrame = { positions: [], edges: [], log: "Heap ready." };
        this.engine.load(frames, (f) => renderer.render(f), initialFrame);
        renderer.render(initialFrame);
        this.engine.play();
        return;
      }

      // 5. TRIE
      if (key === "trie" || this.currentSection === "trie") {
        this.trie = new TrieStructure();
        const word = rawInput || ["code", "algo", "tree"][Utils.randomInt(0, 2)];
        const frames = this.trie.insert(word);
        const renderer = this._activeTrieRenderer || new TrieRenderer(this.dom.visualizationCanvas);
        const initialFrame = { positions: [], edges: [], log: "Trie ready." };
        this.engine.load(frames, (f) => renderer.render(f), initialFrame);
        renderer.render(initialFrame);
        this.engine.play();
        return;
      }

      // 6. HASH TABLE
      if (key === "hashing" || this.currentSection === "hashing") {
        const word = rawInput || `item${Utils.randomInt(1, 99)}`;
        const frames = this.hashTable.insert(word, Utils.randomInt(10, 99));
        const renderer = this._activeHashRenderer || new HashTableRenderer(this.dom.visualizationCanvas);
        const initialFrame = { buckets: this.hashTable.buckets.map((b) => b.slice()) };
        this.engine.load(frames, (f) => renderer.render(f), initialFrame);
        this.engine.play();
        return;
      }

      // 7. LINKED LIST
      if (key === "linked-list" || this.currentSection === "linked-list") {
        const values = customNums && customNums.length ? customNums : [Utils.randomInt(10, 99)];
        const frames = this.linkedList.insertValues(values);
        const renderer = this._activeLinkedRenderer || new LinkedListRenderer(this.dom.visualizationCanvas);
        const initialFrame = { nodes: this.linkedList.items.slice(), doubly: false };
        this.engine.load(frames, (f) => renderer.render(f), initialFrame);
        this.engine.play();
        return;
      }

      // 8. STACK & QUEUE
      if (key.startsWith("linear-") || this.currentSection === "stack" || this.currentSection === "queue") {
        const structure = this.currentSection === "queue" ? this.queue : this.stack;
        const values = customNums && customNums.length ? customNums : [Utils.randomInt(10, 99)];
        const frames = structure.push(values);
        const renderer = this._activeLinearRenderer || new LinearRenderer(this.dom.visualizationCanvas, this.currentSection === "stack" ? "column" : "row");
        const initialFrame = { items: structure.items.slice(), blockClass: this.currentSection === "stack" ? "stack-block" : "queue-block" };
        this.engine.load(frames, (f) => renderer.render(f), initialFrame);
        this.engine.play();
        return;
      }

      // 9. GRAPHS
      if (key.startsWith("graph-") || this.currentSection === "graphs") {
        this._runGraphAlgorithm(key.replace("graph-", ""));
        return;
      }

      // 10. DYNAMIC PROGRAMMING
      if (key.startsWith("dp-") || this.currentSection === "dynamic-programming") {
        this._activateDP(key.replace("dp-", ""));
        this.engine.play();
        return;
      }

      // 11. BACKTRACKING
      if (key.startsWith("backtrack-") || this.currentSection === "backtracking") {
        this._activateBacktracking(key.replace("backtrack-", ""));
        this.engine.play();
        return;
      }

      // Default fallback
      this._runSort("sort-bubble");
    }

    _bindKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        switch (e.key) {
          case " ":
            e.preventDefault();
            this.engine.playing ? this.engine.pause() : this.engine.play();
            break;
          case "ArrowRight":
            this.engine.stepForward();
            break;
          case "ArrowLeft":
            this.engine.stepBackward();
            break;
          case "r":
          case "R":
            this._resetVisualization();
            break;
          default:
            break;
        }
      });
    }

    _bindExportImport() {
      window.DSAVisualizer = {
        exportState: () => {
          Utils.downloadJSON({
            section: this.currentSection,
            algorithm: this.currentAlgoKey,
            array: this.currentArray,
            speed: this.engine.speed,
            stats: {
              comparisons: this.stats.comparisons,
              swaps: this.stats.swaps,
              accesses: this.stats.accesses,
            },
          });
        },
        importState: async (file) => {
          try {
            const data = await Utils.readJSONFile(file);
            if (Array.isArray(data.array)) this.currentArray = data.array;
            if (data.section) this._loadSection(data.section);
            this.logger.log("Imported visualization state from JSON.", "success");
          } catch (err) {
            console.error("Import failed:", err);
            this.logger.log("Failed to import state: invalid JSON file.", "error");
          }
        },
      };
    }
  }

  /* ========================================================================
     18. BOOTSTRAP
     ======================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    try {
      new DSAVisualizerApp();
    } catch (err) {
      console.error("Failed to initialize DSA Visualizer:", err);
    }
  });
})();