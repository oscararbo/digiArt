import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { artworksSignal } from '../../features/home/home';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    description?: string;
    profile_image?: string;
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://127.0.0.1:8000/api';
    
    // User profile signal
    userProfile = signal<UserProfile | null>(null);
    userLikedArtworks = signal<any[]>([]);
    userPersonalArtworks = signal<any[]>([]);
    // Per-artwork signals so every card showing the same artwork id shares the same state
    private artworkSignals: Map<string, WritableSignal<any>> = new Map();

    /**
     * Normalize artwork payloads coming from the API to a consistent front-end shape.
     */
    private normalizeArtwork(raw: any): any {
        if (!raw) return raw;
        const normalized = {
            ...raw,
            title: raw.title ?? '',
            description: raw.description ?? '',
            authorUsername: raw.author_username ?? raw.author ?? raw.user?.username ?? '',
            imageUrl: raw.image_url ?? raw.imageUrl ?? '',
            genreNames: raw.genre_names ?? raw.genreNames ?? [],
            viewCount: raw.view_count ?? 0,
            likeCount: raw.like_count ?? 0,
            createdAt: raw.created_at ?? ''
        };
        return normalized;
    }

    /**
     * Return a writable signal for an artwork id. If it doesn't exist, create it using an optional initial value
     */
    getArtworkSignal(id: string | number, initial?: any): WritableSignal<any> {
        const key = String(id);
        if (!this.artworkSignals.has(key)) {
            // Try to seed from the global artworksSignal if available
            const seed = initial ?? artworksSignal().find(a => String(a.id) === key) ?? null;
            this.artworkSignals.set(key, signal(seed));
        }
        return this.artworkSignals.get(key)!;
    }

    constructor(private http: HttpClient) {
        this.loadCurrentUser();
    }

    /**
     * Propagate an artwork update to all shared signals so all cards showing the same artwork id update together.
     */
    updateArtworkGlobally(updated: any) {
        if (!updated || !updated.id) return;
        const normalized = this.normalizeArtwork(updated);
        try {
            // update global artworks list (replace if exists)
            let found = false;
            artworksSignal.update(list => list.map(a => {
                if (String(a.id) === String(normalized.id)) {
                    found = true;
                    return normalized;
                }
                return a;
            }));
            // if not found, prepend the updated artwork so global state includes it
            if (!found) {
                artworksSignal.update(list => [{ ...(normalized as any) }, ...list]);
            }

            // update personal and liked lists
            this.userPersonalArtworks.update(list => list.map(a => String(a.id) === String(normalized.id) ? normalized : a));
            this.userLikedArtworks.update(list => list.map(a => String(a.id) === String(normalized.id) ? normalized : a));
        } catch (e) {
            console.error('Error propagating artwork update:', e);
        }
        // Also update per-artwork signal if present
        try {
            const key = String(normalized.id);
            const sig = this.artworkSignals.get(key);
            if (sig) sig.set(normalized);
        } catch (e) {
            console.error('Error updating per-artwork signal:', e);
        }
    }

    /**
     * Load current user from localStorage and set it in the signal
     */
    loadCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                this.userProfile.set(parsed);
                // Proactively load user's liked and personal artworks for UI state
                const userId = parsed?.id;
                if (userId) {
                    // Fire-and-forget; these will populate the signals when responses arrive
                    this.getUserLikedArtworks(userId);
                    this.getUserPersonalArtworks(userId);
                }
            } catch (e) {
                console.error('Error parsing user from localStorage:', e);
            }
        }
    }

    /**
     * Get user profile by username
     */
    async getUserProfile(username: string): Promise<UserProfile | null> {
        try {
            const data = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/users/${username}/`));
            if (data?.success) return data.user;
        } catch (error) {
            console.error(`Error fetching user profile for ${username}:`, error);
        }
        return null;
    }

    /**
     * Update current user profile
     */
    async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
        try {
            const token = localStorage.getItem('access_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
            const data = await firstValueFrom(
                this.http.put<any>(`${this.apiUrl}/users/me/update/`, updates, { headers })
            );
            if (data?.success) {
                const currentProfile = this.userProfile();
                const oldUsername = currentProfile?.username;
                const updated: UserProfile = (data?.user
                    ? { ...(currentProfile as UserProfile), ...(data.user as UserProfile) }
                    : { ...(currentProfile as UserProfile), ...updates }) as UserProfile;
                this.userProfile.set(updated);
                localStorage.setItem('user', JSON.stringify(updated));
                if (oldUsername && updated.username && updated.username !== oldUsername) {
                    this.updateAuthorUsername(oldUsername, updated.username);
                }
                return true;
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
        return false;
    }

    /**
     * Check if username exists
     */
    async checkUsernameExists(username: string): Promise<boolean> {
        try {
            const data = await firstValueFrom(
                this.http.get<any>(`${this.apiUrl}/auth/check-username/?username=${encodeURIComponent(username)}`)
            );
            if (typeof data?.available === 'boolean') {
                return !data.available;
            }
            return !!data.exists;
        } catch (error) {
            // Ignore expected 400s for invalid/short usernames to avoid console noise
            return false;
        }
    }

    /**
     * Update author username in all local artwork signals and lists.
     */
    private updateAuthorUsername(oldUsername: string, newUsername: string) {
        const updateArtwork = (artwork: any) => {
            if (!artwork) return artwork;
            let changed = false;
            let next = artwork;

            if (artwork?.authorUsername === oldUsername) {
                next = { ...next, authorUsername: newUsername };
                changed = true;
            }
            if (artwork?.author === oldUsername) {
                next = { ...next, author: newUsername };
                changed = true;
            }
            if (artwork?.autor?.username === oldUsername) {
                next = { ...next, autor: { ...artwork.autor, username: newUsername } };
                changed = true;
            }
            if (artwork?.user?.username === oldUsername) {
                next = { ...next, user: { ...artwork.user, username: newUsername } };
                changed = true;
            }

            return changed ? next : artwork;
        };

        this.userPersonalArtworks.update(list => list.map(updateArtwork));
        this.userLikedArtworks.update(list => list.map(updateArtwork));
        artworksSignal.update(list => list.map(updateArtwork));

        this.artworkSignals.forEach((sig) => {
            const current = sig();
            const updated = updateArtwork(current);
            if (updated !== current) sig.set(updated);
        });
    }

    /**
     * Get artworks liked by a user
     */
    async getUserLikedArtworks(userId: number): Promise<any[]> {
        try {
            const data = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/users/${userId}/liked-artworks/`));
            if (data?.success) {
                const normalized = (data.artworks || []).map((artwork: any) => this.normalizeArtwork(artwork));
                this.userLikedArtworks.set(normalized);
                return normalized;
            }
        } catch (error) {
            console.error('Error fetching user liked artworks:', error);
            this.userLikedArtworks.set([]);
        }
        return [];
    }

    /**
     * Get artworks uploaded by a user
     */
    async getUserPersonalArtworks(userId: number): Promise<any[]> {
        try {
            const data = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/users/${userId}/artworks/`));
            if (data?.success) {
                const normalized = (data.artworks || []).map((artwork: any) => this.normalizeArtwork(artwork));
                this.userPersonalArtworks.set(normalized);
                return normalized;
            }
        } catch (error) {
            console.error('Error fetching user personal artworks:', error);
            this.userPersonalArtworks.set([]);
        }
        return [];
    }
}
