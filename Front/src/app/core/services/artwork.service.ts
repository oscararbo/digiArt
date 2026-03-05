import { Injectable, inject } from '@angular/core';

export interface Artwork {
    id: string;
    title: string;
    description: string;
    authorUsername: string;
    authorId: string;
    authorProfileImage: string;
    imageUrl: string;
    genreNames: string[];
    viewCount: number;
    likeCount: number;
    createdAt: string;
}

export interface Comment {
    id: string;
    username: string;
    profileImage: string;
    content: string;
    createdAt: string;
    relativeTime: string;
}

export interface ArtworkDetail extends Artwork {
    comments: Comment[];
    isLiked: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ArtworkService {
    private baseUrl = 'http://127.0.0.1:8000/api';

    /**
     * Get artwork details by ID
     */
    async getArtworkDetail(id: string): Promise<ArtworkDetail> {
        try {
            const token = localStorage.getItem('access_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/artworks/${id}/`, { headers });
            const data = await response.json();
            if (data.success) {
                const artwork = {
                    ...data.artwork,
                    isLiked: data.artwork.isLiked ?? data.artwork.is_liked ?? false,
                    likeCount: data.artwork.likeCount ?? data.artwork.like_count ?? data.artwork.likes ?? 0
                };
                return artwork;
            }
            throw new Error('Error fetching artwork detail');
        } catch (error) {
            console.error('Error fetching artwork detail:', error);
            throw error;
        }
    }

    /**
     * Increment view count for an artwork
     */
    async incrementViewCount(artworkId: string): Promise<void> {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                return;
            }

            const response = await fetch(`${this.baseUrl}/artworks/${artworkId}/view/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                return;
            }
        } catch {
            return;
        }
    }

    /**
     * Toggle like on an artwork
     */
    async toggleLike(artworkId: string): Promise<{ isLiked: boolean; likeCount: number }> {
        try {
            const response = await fetch(`${this.baseUrl}/artworks/${artworkId}/like/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const result = {
                    isLiked: data.action === 'liked',
                    likeCount: data.likes
                };
                return result;
            }
            throw new Error('Error toggling like');
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }

    /**
     * Get comments for an artwork
     */
    async getComments(artworkId: string): Promise<Comment[]> {
        try {
            const response = await fetch(`${this.baseUrl}/artworks/${artworkId}/comments/`);
            const data = await response.json();
            if (data.success) {
                return data.comments;
            }
            throw new Error('Error fetching comments');
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }

    /**
     * Add a comment to an artwork
     */
    async addComment(artworkId: string, content: string): Promise<Comment> {
        try {
            const response = await fetch(`${this.baseUrl}/artworks/${artworkId}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ content })
            });
            const data = await response.json();
            if (data.success) {
                return data.comment;
            }
            throw new Error('Error adding comment');
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(artworkId: string, commentId: string): Promise<void> {
        try {
            await fetch(`${this.baseUrl}/artworks/${artworkId}/comments/${commentId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }
}
