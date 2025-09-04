import { Key, Sequence, Keytip } from './types';

export type TrieNode = {
  children: Map<Key, TrieNode>;
  completeKeytips: Keytip[]; // keytips that end exactly here
};

export const createTrieNode = (): TrieNode => ({
  children: new Map(),
  completeKeytips: [],
});

export const buildTrie = (keytips: Keytip[]): TrieNode => {
  const root = createTrieNode();
  for (const kt of keytips) {
    let node = root;
    for (const raw of kt.sequence) {
      const k = normalizeKey(raw);
      if (!node.children.has(k)) node.children.set(k, createTrieNode());
      node = node.children.get(k)!;
    }
    node.completeKeytips.push(kt);
  }
  return root;
};

export const normalizeKey = (k: string): Key => k.length === 1 ? k.toUpperCase() : k.toUpperCase();

export type MatchResult = {
  isExact: boolean;
  options: { key: Key; title: string; id: string }[];
  keytips: Keytip[]; // exact matches when isExact is true, otherwise empty
};

const getOptionTitle = (key: Key, child: TrieNode, sequence: Sequence): string => {
  // If there's a complete keytip at this child, use its title
  if (child.completeKeytips.length > 0) {
    return child.completeKeytips[0].title;
  }
  
  // For top-level options (sequence is empty), use group names
  if (sequence.length === 0) {
    // Find any keytip in this subtree to get the group name
    const anyKeytip = findAnyKeytipInSubtree(child);
    if (anyKeytip?.group) {
      return anyKeytip.group;
    }
  }
  
  // For intermediate paths, provide meaningful descriptions
  if (sequence.length === 1 && sequence[0] === 'H') {
    switch (key) {
      case 'V': return 'Paste';
      case 'B': return 'Borders';
      case 'O': return 'Format';
    }
  }
  
  // Fall back to the key letter
  return key;
};

const findAnyKeytipInSubtree = (node: TrieNode): Keytip | null => {
  if (node.completeKeytips.length > 0) {
    return node.completeKeytips[0];
  }
  
  const entries = Array.from(node.children.entries());
  for (const [, child] of entries) {
    const result = findAnyKeytipInSubtree(child);
    if (result) return result;
  }
  
  return null;
};

export const queryTrie = (root: TrieNode, sequence: Sequence): MatchResult => {
  let node: TrieNode | undefined = root;
  for (const raw of sequence) {
    const k = normalizeKey(raw);
    node = node?.children.get(k);
    if (!node) return { isExact: false, options: [], keytips: [] };
  }
  const options = Array.from(node.children.entries()).map(([key, child]) => {
    const title = getOptionTitle(key, child, sequence);
    // Use the key as the selectable id so UI can append it directly
    const id = key;
    return { key, title, id };
  });
  const keytips = node.completeKeytips.slice();
  const isExact = keytips.length > 0;
  return { isExact, options, keytips };
};


