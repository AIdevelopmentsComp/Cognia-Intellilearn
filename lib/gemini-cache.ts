/**
 * @fileoverview Gemini AI Response Cache
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-18
 * @updated 2023-12-22
 * @version 1.0.0
 * 
 * @description
 * Implements a caching system for Gemini AI responses.
 * Reduces API calls and costs by storing frequently requested responses.
 * 
 * @context
 * Performance optimization component for AI interactions.
 * Used by the chatWithAI and generateAIResponse functions.
 * Implements time-based expiration and size limits.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added automatic cache cleanup
 * v1.0.2 - Optimized key generation for better hit rates
 */

/**
 * Cache Entry Structure
 * @context Defines the shape of individual cache entries
 */
interface CacheEntry {
  response: string;   // The AI response text
  timestamp: number;  // Entry creation time (milliseconds)
}

/**
 * Gemini Cache Manager
 * 
 * @class
 * @context
 * Handles caching of AI responses to reduce API calls.
 * 
 * @description
 * Implements an in-memory cache with:
 * - Maximum entry limit
 * - Time-to-live expiration
 * - Automatic cleanup
 * - Intelligent key generation
 */
class GeminiCache {
  private cache: Map<string, CacheEntry>;
  private maxEntries: number;
  private ttl: number; // Time to live in milliseconds

  /**
   * Constructor
   * 
   * @param {number} [maxEntries=100] - Maximum number of entries to store
   * @param {number} [ttl=3600000] - Time-to-live in milliseconds (default: 1 hour)
   * 
   * @context
   * Initializes the cache with configurable size and TTL.
   */
  constructor(maxEntries: number = 100, ttl: number = 3600000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttl = ttl;
  }

  /**
   * Generate a unique cache key from conversation messages
   * 
   * @param {Array<{role: string, content: string}>} messages - Conversation messages
   * @returns {string} Unique key for the conversation state
   * 
   * @context
   * Internal method to create lookup keys for the cache.
   * 
   * @description
   * Creates a unique identifier for the conversation state by:
   * - Considering only the last 3 messages for context
   * - Combining role and content into a formatted string
   * This approach balances specificity with reusability.
   */
  private generateKey(messages: Array<{role: string, content: string}>): string {
    // Simplify history for the key by using only the last 3 messages
    // to maintain reasonable context while avoiding overly specific keys
    const relevantMessages = messages.slice(-3);
    return relevantMessages.map(msg => `${msg.role}:${msg.content}`).join('|');
  }

  /**
   * Retrieve a response from the cache
   * 
   * @param {Array<{role: string, content: string}>} messages - Conversation messages
   * @returns {string | null} Cached response or null if not found/expired
   * 
   * @context
   * Primary cache lookup method for AI interactions.
   * 
   * @description
   * Attempts to retrieve a cached response by:
   * 1. Generating a key from the conversation messages
   * 2. Checking if an entry exists for that key
   * 3. Verifying the entry hasn't expired
   * 4. Returning the cached response or null
   */
  get(messages: Array<{role: string, content: string}>): string | null {
    const key = this.generateKey(messages);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if the entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }

  /**
   * Store a response in the cache
   * 
   * @param {Array<{role: string, content: string}>} messages - Conversation messages
   * @param {string} response - AI response text to cache
   * 
   * @context
   * Primary cache storage method for AI interactions.
   * 
   * @description
   * Stores a response in the cache with:
   * 1. Size limit enforcement (LRU eviction)
   * 2. Key generation from conversation state
   * 3. Timestamp for TTL calculation
   */
  set(messages: Array<{role: string, content: string}>, response: string): void {
    // If cache is full, remove the oldest entry (simple LRU implementation)
    if (this.cache.size >= this.maxEntries) {
      const oldestEntry = Array.from(this.cache.keys())[0];
      if (oldestEntry) {
        this.cache.delete(oldestEntry);
      }
    }
    
    const key = this.generateKey(messages);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Remove expired entries from the cache
   * 
   * @context
   * Maintenance method to prevent memory leaks.
   * 
   * @description
   * Iterates through all cache entries and removes any that have
   * exceeded their time-to-live. Should be called periodically
   * to keep the cache size under control.
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all entries from the cache
   * 
   * @context
   * Utility method for cache reset.
   * 
   * @description
   * Completely empties the cache, removing all stored responses.
   * Useful when updating models or when cached responses might
   * be invalidated by system changes.
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Global singleton instance of the Gemini cache
 * @context Application-wide cache for AI responses
 */
const geminiCache = new GeminiCache();

export default geminiCache; 