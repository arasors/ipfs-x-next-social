"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Hash, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { usePostStore } from "@/store/postStore";
import { useUserStore } from "@/store/userStore";
import { Post } from "@/models/Post";
import { User as UserModel, UserProfile } from "@/models/User";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBoxProps {
  variant?: "icon" | "full";
  className?: string;
}

export function SearchBox({ variant = "full", className }: SearchBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { posts } = usePostStore();
  const { users, getUserProfile } = useUserStore();
  
  const [searchResults, setSearchResults] = useState<{
    users: UserProfile[];
    posts: Post[];
    tags: string[];
  }>({
    users: [],
    posts: [],
    tags: []
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  
  // Perform search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults({ users: [], posts: [], tags: [] });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Search users
      const userResults = Object.values(users)
        .map(user => getUserProfile(user.address))
        .filter(profile => 
          profile?.displayName?.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
          profile?.username?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          profile?.address.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .slice(0, 5);
      
      // Search posts
      const postResults = posts
        .filter(post => 
          post.content?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          post.authorAddress?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          post.authorName?.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .slice(0, 5);
      
      // Search for tags in posts
      const tagMatches = new Set<string>();
      posts.forEach(post => {
        const content = post.content || "";
        const hashtags = content.match(/#(\w+)/g) || [];
        
        hashtags.forEach(tag => {
          const cleanTag = tag.substring(1).toLowerCase();
          if (cleanTag.includes(debouncedQuery.toLowerCase())) {
            tagMatches.add(cleanTag);
          }
        });
      });
      
      setSearchResults({
        users: userResults.filter(user => user !== null) as UserProfile[],
        posts: postResults,
        tags: Array.from(tagMatches).slice(0, 5)
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, users, posts, getUserProfile]);
  
  // Handle search submission
  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };
  
  // Handle selecting a search result
  const handleSelect = (type: string, item: any) => {
    setOpen(false);
    
    switch (type) {
      case 'user':
        router.push(`/profile/${item.address}`);
        break;
      case 'post':
        router.push(`/post/${item.id}`);
        break;
      case 'tag':
        router.push(`/tag/${item}`);
        break;
      default:
        break;
    }
  };
  
  if (variant === "icon") {
    return (
      <>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setOpen(true)}
          className={className}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
        
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput 
            placeholder="Search for users, posts, or tags..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <SearchResults 
              results={searchResults} 
              isLoading={isLoading} 
              query={query}
              onSelect={handleSelect}
            />
          </CommandList>
        </CommandDialog>
      </>
    );
  }
  
  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          className="pl-9 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          onClick={() => setOpen(true)}
        />
        
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-10 px-0"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search for users, posts, or tags..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <SearchResults 
            results={searchResults} 
            isLoading={isLoading} 
            query={query}
            onSelect={handleSelect}
          />
        </CommandList>
      </CommandDialog>
    </div>
  );
}

interface SearchResultsProps {
  results: {
    users: UserProfile[];
    posts: Post[];
    tags: string[];
  };
  isLoading: boolean;
  query: string;
  onSelect: (type: string, item: any) => void;
}

function SearchResults({ results, isLoading, query, onSelect }: SearchResultsProps) {
  const { users, posts, tags } = results;
  const hasResults = users.length > 0 || posts.length > 0 || tags.length > 0;
  
  if (isLoading) {
    return (
      <div className="py-6 text-center text-sm">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-muted-foreground">Searching...</p>
      </div>
    );
  }
  
  if (!query) {
    return (
      <CommandEmpty>
        <p className="py-4 text-center text-sm text-muted-foreground">
          Start typing to search...
        </p>
      </CommandEmpty>
    );
  }
  
  if (!hasResults) {
    return (
      <CommandEmpty>
        <p className="py-4 text-center text-sm text-muted-foreground">
          No results found for "{query}"
        </p>
      </CommandEmpty>
    );
  }
  
  return (
    <>
      {users.length > 0 && (
        <CommandGroup heading="Users">
          {users.map((user) => (
            <CommandItem
              key={user.address}
              onSelect={() => onSelect('user', user)}
              className="flex items-center gap-2"
            >
              <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground mr-1">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{user.displayName || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">
                  {user.username ? `@${user.username}` : user.address.substring(0, 10) + '...'}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      
      {posts.length > 0 && (
        <CommandGroup heading="Posts">
          {posts.map((post) => (
            <CommandItem
              key={post.id}
              onSelect={() => onSelect('post', post)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground mr-1" />
              <div className="flex flex-col">
                <span className="line-clamp-1">{post.content || 'No content'}</span>
                <span className="text-xs text-muted-foreground">
                  By {post.authorName || post.authorAddress.substring(0, 10) + '...'}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      
      {tags.length > 0 && (
        <CommandGroup heading="Tags">
          {tags.map((tag) => (
            <CommandItem
              key={tag}
              onSelect={() => onSelect('tag', tag)}
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="font-medium">#{tag}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      
      <div className="py-2 px-2 text-xs text-muted-foreground border-t">
        <p>Press <kbd className="bg-muted px-1 rounded">Enter</kbd> to view all results</p>
      </div>
    </>
  );
} 