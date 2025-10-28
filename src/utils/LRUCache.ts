/**
 * 🚀 LRU Cache - Production-Grade Least Recently Used Cache
 *
 * Features:
 * - O(1) get/set operations
 * - Automatic eviction of least recently used items
 * - Statistics tracking (hits, misses, evictions)
 * - Custom eviction callbacks
 * - Memory-efficient design
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

interface LRUCacheOptions<K, V> {
  maxSize: number;
  enableStats?: boolean;
  onEvict?: (key: K, value: V) => void;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  hitRate: number;
}

export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null;
  private tail: CacheNode<K, V> | null;
  private enableStats: boolean;
  private onEvict?: (key: K, value: V) => void;

  // Statistics
  private hits: number;
  private misses: number;
  private evictions: number;

  constructor(options: LRUCacheOptions<K, V>) {
    this.maxSize = options.maxSize;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.enableStats = options.enableStats ?? false;
    this.onEvict = options.onEvict;

    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      if (this.enableStats) this.misses++;
      return undefined;
    }

    if (this.enableStats) this.hits++;

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    let node = this.cache.get(key);

    if (node) {
      // Update existing node
      node.value = value;
      this.moveToFront(node);
    } else {
      // Create new node
      node = {
        key,
        value,
        prev: null,
        next: null,
      };

      this.cache.set(key, node);
      this.addToFront(node);

      // Evict if necessary
      if (this.cache.size > this.maxSize) {
        this.evictLRU();
      }
    }
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      currentSize: this.cache.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
    };
  }

  private moveToFront(node: CacheNode<K, V>): void {
    if (node === this.head) return;

    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: CacheNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) return;

    const evictedNode = this.tail;
    this.removeNode(evictedNode);
    this.cache.delete(evictedNode.key);

    if (this.enableStats) this.evictions++;

    if (this.onEvict) {
      this.onEvict(evictedNode.key, evictedNode.value);
    }
  }

  get size(): number {
    return this.cache.size;
  }
}
