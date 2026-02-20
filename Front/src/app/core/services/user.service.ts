import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { artworksSignal } from '../../features/home/home';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    nombre: string;
    apellidos: string;
    descripcion?: string;
    imagen_perfil?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://127.0.0.1:8000/api';
    
    // Signal para el perfil del usuario
    userProfile = signal<UserProfile | null>(null);
    userLikedArtworks = signal<any[]>([]);
    userPersonalArtworks = signal<any[]>([]);
    // Per-artwork signals so every card showing the same artwork id shares the same state
    private artworkSignals: Map<string, WritableSignal<any>> = new Map();

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
        try {
            // update global artworks list (replace if exists)
            let found = false;
            artworksSignal.update(list => list.map(a => {
                if (String(a.id) === String(updated.id)) {
                    found = true;
                    return updated;
                }
                return a;
            }));
            // if not found, prepend the updated artwork so global state includes it
            if (!found) {
                artworksSignal.update(list => [{ ...(updated as any) }, ...list]);
            }

            // update personal and liked lists
            this.userPersonalArtworks.update(list => list.map(a => String(a.id) === String(updated.id) ? updated : a));
            this.userLikedArtworks.update(list => list.map(a => String(a.id) === String(updated.id) ? updated : a));
        } catch (e) {
            console.error('Error propagating artwork update:', e);
        }
        // Also update per-artwork signal if present
        try {
            const key = String(updated.id);
            const sig = this.artworkSignals.get(key);
            if (sig) sig.set(updated);
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
            const data = await firstValueFrom(this.http.put<any>(`${this.apiUrl}/users/me/update/`, updates));
            if (data?.success) {
                const currentProfile = this.userProfile();
                const updated: UserProfile = {
                    ...(currentProfile as UserProfile),
                    ...updates
                } as UserProfile;
                this.userProfile.set(updated);
                localStorage.setItem('user', JSON.stringify(updated));
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
            const data = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/users/check-username/?username=${username}`));
            return !!data.exists;
        } catch (error) {
            console.error('Error checking username:', error);
            return false;
        }
    }

    /**
     * Get artworks liked by a user
     */
    async getUserLikedArtworks(userId: number): Promise<any[]> {
        try {
            const data = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/users/${userId}/liked-artworks/`));
            if (data?.success) {
                this.userLikedArtworks.set(data.artworks);
                return data.artworks;
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
                this.userPersonalArtworks.set(data.artworks);
                return data.artworks;
            }
        } catch (error) {
            console.error('Error fetching user personal artworks:', error);
            this.userPersonalArtworks.set([]);
        }
        return [];
    }
}
