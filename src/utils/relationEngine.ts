/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Friendship } from '../types';

export type RelationState = 'owner' | 'friend' | 'stranger';

/**
 * Centralized relationship checker for profile access levels.
 * Handles the 3 mandatory profile states:
 * 1. 'owner' -> Full access: edit data, stats, settings, publications.
 * 2. 'friend' -> Extended social access: message, react, comment, see friend-only posts.
 * 3. 'stranger' -> Limited access: only public name, avatar, bio, and a CTA to connect.
 */
export function checkRelation(
  currentUser: User | null | undefined,
  targetUser: User,
  friendships: Friendship[]
): RelationState {
  if (!currentUser) return 'stranger';
  if (currentUser.id === 'guest') return 'stranger';
  if (currentUser.id === targetUser.id) return 'owner';

  const isFriend = friendships.some(f => 
    f.status === 'accepted' && 
    ((f.senderId === currentUser.id && f.receiverId === targetUser.id) || 
     (f.senderId === targetUser.id && f.receiverId === currentUser.id))
  );

  return isFriend ? 'friend' : 'stranger';
}
