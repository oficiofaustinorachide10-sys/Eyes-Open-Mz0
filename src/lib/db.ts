import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDoc,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User, Post, Story, Notification, Friendship, ChatPermission } from '../types';
import { SEED_USERS, SEED_POSTS, SEED_STORIES } from '../utils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let userId: string | null = null;
  try {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      userId = JSON.parse(stored).id;
    }
  } catch (e) {}

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Utility to clean undefined values recursively from objects before writing to Firestore
export function sanitizeDoc<T extends object>(obj: T): T {
  const clean = { ...obj } as any;
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      delete clean[key];
    } else if (clean[key] !== null && typeof clean[key] === 'object') {
      if (Object.prototype.toString.call(clean[key]) === '[object Object]') {
        clean[key] = sanitizeDoc(clean[key]);
      }
    }
  });
  return clean;
}

// Helper to check if database has collections and seed them if empty
export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Users
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    if (usersSnapshot.empty) {
      for (const u of SEED_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }
      console.log('Seeded users collection successfully.');
    }

    // 2. Seed Posts
    const postsCol = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsCol);
    if (postsSnapshot.empty) {
      for (const p of SEED_POSTS) {
        // Initial posts can have empty comments array
        await setDoc(doc(db, 'posts', p.id), {
          ...p,
          comments: []
        });
      }
      console.log('Seeded posts collection successfully.');
    }

    // 3. Seed Stories
    const storiesCol = collection(db, 'stories');
    const storiesSnapshot = await getDocs(storiesCol);
    if (storiesSnapshot.empty) {
      for (const s of SEED_STORIES) {
        await setDoc(doc(db, 'stories', s.id), s);
      }
      console.log('Seeded stories collection successfully.');
    }

    // 4. Seed Chat Messages
    const chatsCol = collection(db, 'chats');
    const chatsSnapshot = await getDocs(chatsCol);
    if (chatsSnapshot.empty) {
      const initialMessages = [
        {
          id: 'msg_1',
          sender: {
            name: 'Alex MZ',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            id: 'user1'
          },
          text: 'Olá malta! Sejam muito bem-vindos à rede de conversação oficial do Eyes Open MZ 🇲🇿',
          timestamp: Date.now() - 3600000
        },
        {
          id: 'msg_2',
          sender: {
            name: 'Oficio MZ',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
            id: 'user2'
          },
          text: 'Grande Alex! O feed 4D de histórias está a correr extremamente bem. Parabéns pela arquitetura!',
          timestamp: Date.now() - 1800000
        }
      ];
      for (const m of initialMessages) {
        await setDoc(doc(db, 'chats', m.id), m);
      }
      console.log('Seeded chats collection successfully.');
    }

    // 5. Seed Notifications
    const notificationsCol = collection(db, 'notifications');
    const notificationsSnapshot = await getDocs(notificationsCol);
    if (notificationsSnapshot.empty) {
      const initialNotifications = [
        {
          id: 'notif_1',
          recipientId: 'user1', // Alex MZ
          title: 'Nova Estrela ⭐',
          text: 'Oficio MZ deu uma estrela à sua publicação 4D.',
          type: 'star',
          sender: {
            id: 'user2',
            name: 'Oficio MZ',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
          },
          read: false,
          targetId: 'post1',
          targetView: 'feed',
          timestamp: Date.now() - 3600000
        },
        {
          id: 'notif_2',
          recipientId: 'user1', // Alex MZ
          title: 'Novo Comentário 💬',
          text: 'Oficio MZ comentou: "Excelente enquadramento, parabéns!".',
          type: 'comment',
          sender: {
            id: 'user2',
            name: 'Oficio MZ',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
          },
          read: false,
          targetId: 'post1',
          targetView: 'feed',
          timestamp: Date.now() - 1800000
        }
      ];
      for (const n of initialNotifications) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }
      console.log('Seeded notifications collection successfully.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// Subscribe to real-time collections
export function subscribeUsers(callback: (users: User[]) => void) {
  const usersCol = collection(db, 'users');
  return onSnapshot(usersCol, (snapshot) => {
    const list: User[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as User);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'users');
  });
}

export function subscribePosts(callback: (posts: Post[]) => void) {
  const postsCol = collection(db, 'posts');
  // Order by timestamp desc
  const q = query(postsCol, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Post[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data
      } as Post);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'posts');
  });
}

export function subscribeStories(callback: (stories: Story[]) => void) {
  const storiesCol = collection(db, 'stories');
  const q = query(storiesCol, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Story[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data
      } as Story);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'stories');
  });
}

export function subscribeChats(callback: (messages: any[]) => void) {
  const chatsCol = collection(db, 'chats');
  const q = query(chatsCol, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'chats');
  });
}

// User Profile Actions
export async function dbUpdateUser(user: User) {
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function dbDeleteUser(userId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

// Post Actions
export async function dbCreatePost(post: Post) {
  try {
    const cleanPost = sanitizeDoc(post);
    await setDoc(doc(db, 'posts', cleanPost.id), {
      ...cleanPost,
      comments: cleanPost.comments || []
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `posts/${post.id}`);
  }
}

export async function dbDeletePost(postId: string) {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
  }
}

export async function dbUpdatePost(post: Post) {
  try {
    const cleanPost = sanitizeDoc(post);
    await setDoc(doc(db, 'posts', cleanPost.id), cleanPost, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `posts/${post.id}`);
  }
}

// User unique votes / ratings functions
export async function dbCheckUserVote(userId: string, postId: string): Promise<boolean> {
  try {
    const voteRef = doc(db, 'votes', `${userId}_${postId}`);
    const voteSnap = await getDoc(voteRef);
    return voteSnap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `votes/${userId}_${postId}`);
    return false;
  }
}

export async function dbCreateUserVote(userId: string, postId: string, location: string | undefined, ratingValue: number): Promise<boolean> {
  try {
    const voteRef = doc(db, 'votes', `${userId}_${postId}`);
    const voteSnap = await getDoc(voteRef);
    if (voteSnap.exists()) {
      alert('Você já avaliou esta publicação.');
      return false;
    }

    const voteData = sanitizeDoc({
      userId: userId || '',
      postId: postId || '',
      location: location || '',
      rating: ratingValue || 0,
      timestamp: Date.now()
    });

    await setDoc(voteRef, voteData);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `votes/${userId}_${postId}`);
    return false;
  }
}

// Story Actions
export async function dbCreateStory(story: Story) {
  try {
    await setDoc(doc(db, 'stories', story.id), story);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `stories/${story.id}`);
  }
}

export async function dbDeleteStory(storyId: string) {
  try {
    await deleteDoc(doc(db, 'stories', storyId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `stories/${storyId}`);
  }
}

export async function dbUpdateStory(story: Story) {
  try {
    await setDoc(doc(db, 'stories', story.id), story, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stories/${story.id}`);
  }
}

// Message Actions
export async function dbSendMessage(message: { id: string; sender: any; text: string; timestamp: number }) {
  try {
    await setDoc(doc(db, 'chats', message.id), message);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `chats/${message.id}`);
  }
}

export async function dbUpdateMessage(message: any) {
  try {
    await setDoc(doc(db, 'chats', message.id), message);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `chats/${message.id}`);
  }
}

export async function dbDeleteMessage(messageId: string) {
  try {
    await deleteDoc(doc(db, 'chats', messageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `chats/${messageId}`);
  }
}

// Notification Actions
export function subscribeNotifications(recipientId: string, callback: (notifications: Notification[]) => void) {
  const notificationsCol = collection(db, 'notifications');
  const q = query(notificationsCol, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Notification[] = [];
    snapshot.forEach((docSnap) => {
      const notif = docSnap.data() as Notification;
      if (notif.recipientId === 'all' || notif.recipientId === recipientId) {
        list.push({
          id: docSnap.id,
          ...notif
        });
      }
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
  });
}

export async function dbCreateNotification(notif: Notification) {
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `notifications/${notif.id}`);
  }
}

export async function dbUpdateNotification(notif: Notification) {
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
  }
}

export async function dbDeleteNotification(notifId: string) {
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${notifId}`);
  }
}

export async function dbClearAllNotifications(recipientId: string) {
  try {
    const notificationsCol = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsCol);
    const promises: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.recipientId === recipientId) {
        promises.push(deleteDoc(docSnap.ref));
      }
    });
    await Promise.all(promises);
  } catch (err) {
    console.error('Error clearing notifications:', err);
    handleFirestoreError(err, OperationType.DELETE, 'notifications');
  }
}

// Friendship Subscriptions and Actions
export function subscribeFriendships(callback: (friendships: Friendship[]) => void) {
  const friendshipsCol = collection(db, 'friendships');
  return onSnapshot(friendshipsCol, (snapshot) => {
    const list: Friendship[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      } as Friendship);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'friendships');
  });
}

export async function enviarPedidoAmizade(targetUserId: string) {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    alert("Precisa de estar autenticado para enviar pedidos de amizade.");
    return;
  }

  // 1. Bloqueio de Auto-Interação
  if (currentUid === targetUserId) {
    alert("Não é permitido enviar um pedido de amizade para si mesmo.");
    return;
  }

  try {
    // 2. Prevenção de Duplicidade
    const docId1 = `${currentUid}_${targetUserId}`;
    const docId2 = `${targetUserId}_${currentUid}`;

    const docRef1 = doc(db, 'friendships', docId1);
    const docRef2 = doc(db, 'friendships', docId2);

    const [snap1, snap2] = await Promise.all([getDoc(docRef1), getDoc(docRef2)]);

    if (snap1.exists() || snap2.exists()) {
      alert("Já existe um pedido de amizade ou vínculo entre vocês!");
      return;
    }

    // Criar o novo documento de amizade
    const userDoc = await getDoc(doc(db, 'users', currentUid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const senderName = userData?.nickname || auth.currentUser?.displayName || 'Utilizador';
    const senderAvatar = userData?.avatar || auth.currentUser?.photoURL || 'https://i.pravatar.cc/100?img=1';

    const newFriendship: Friendship = {
      id: docId1,
      senderId: currentUid,
      receiverId: targetUserId,
      status: 'pending',
      level: 'conhecido',
      timestamp: Date.now()
    };

    // Usando setDoc com ID composto
    await setDoc(doc(db, 'friendships', docId1), newFriendship);
    alert("Pedido de amizade enviado com sucesso!");

    // Criar uma notificação
    const notifId = 'notif_friend_' + currentUid + '_' + Math.random().toString(36).substring(2, 9);
    const newNotif: Notification = {
      id: notifId,
      recipientId: targetUserId,
      title: 'Pedido de Amizade Social 👥',
      text: `${senderName} enviou-lhe um pedido de amizade social no Feed.`,
      type: 'friend_request',
      sender: {
        id: currentUid,
        name: senderName,
        avatar: senderAvatar
      },
      read: false,
      timestamp: Date.now(),
      targetView: 'notificacoes'
    };
    await setDoc(doc(db, 'notifications', notifId), newNotif);

  } catch (err) {
    console.error("Erro ao enviar pedido de amizade:", err);
    handleFirestoreError(err, OperationType.CREATE, `friendships/${currentUid}_${targetUserId}`);
  }
}

export async function dbCreateFriendship(friendship: Friendship) {
  try {
    await setDoc(doc(db, 'friendships', friendship.id), friendship);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `friendships/${friendship.id}`);
  }
}

export async function dbUpdateFriendship(friendship: Friendship) {
  try {
    await setDoc(doc(db, 'friendships', friendship.id), friendship, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `friendships/${friendship.id}`);
  }
}

export async function dbDeleteFriendship(friendshipId: string) {
  try {
    await deleteDoc(doc(db, 'friendships', friendshipId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `friendships/${friendshipId}`);
  }
}

// Chat Permission Subscriptions and Actions
export function subscribeChatPermissions(callback: (permissions: ChatPermission[]) => void) {
  const permissionsCol = collection(db, 'chat_permissions');
  return onSnapshot(permissionsCol, (snapshot) => {
    const list: ChatPermission[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      } as ChatPermission);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'chat_permissions');
  });
}

export async function dbCreateChatPermission(permission: ChatPermission) {
  try {
    await setDoc(doc(db, 'chat_permissions', permission.id), permission);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `chat_permissions/${permission.id}`);
  }
}

export async function dbUpdateChatPermission(permission: ChatPermission) {
  try {
    await setDoc(doc(db, 'chat_permissions', permission.id), permission, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `chat_permissions/${permission.id}`);
  }
}

export async function dbDeleteChatPermission(permissionId: string) {
  try {
    await deleteDoc(doc(db, 'chat_permissions', permissionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `chat_permissions/${permissionId}`);
  }
}

// Group Live Video Actions
export function subscribeGroupLives(callback: (participants: any[]) => void) {
  const livesCol = collection(db, 'group_lives');
  return onSnapshot(livesCol, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'group_lives');
  });
}

export async function dbJoinGroupLive(userId: string, data: { nickname: string; avatar: string }) {
  try {
    await setDoc(doc(db, 'group_lives', userId), {
      userId,
      nickname: data.nickname,
      avatar: data.avatar,
      joinedAt: Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `group_lives/${userId}`);
  }
}

export async function dbLeaveGroupLive(userId: string) {
  try {
    await deleteDoc(doc(db, 'group_lives', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `group_lives/${userId}`);
  }
}

export async function dbDeleteExpiredGuests() {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('isGuest', '==', true));
    const snap = await getDocs(q);
    const now = Date.now();
    for (const d of snap.docs) {
      const data = d.data();
      if (data.expiresAt && data.expiresAt < now) {
        await deleteDoc(doc(db, 'users', d.id));
        console.log(`[DB] Deleted expired guest account: ${d.id}`);
      }
    }
  } catch (err) {
    console.error('[DB] Error deleting expired guests:', err);
  }
}

export async function dbDeleteGuestUser(guestId: string) {
  try {
    await deleteDoc(doc(db, 'users', guestId));
    console.log(`[DB] Deleted guest account: ${guestId}`);
  } catch (err) {
    console.error('[DB] Error deleting guest account:', err);
  }
}

export function logoutSeguro() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
}

export async function dbWipeAllDataAndAccounts() {
  const collectionsToWipe = [
    'users',
    'posts',
    'stories',
    'chats',
    'friendships',
    'chat_permissions',
    'group_lives',
    'notifications'
  ];

  for (const colName of collectionsToWipe) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
      }
      console.log(`[Wipe] Coleção ${colName} limpa com sucesso.`);
    } catch (e) {
      console.error(`[Wipe] Erro ao limpar coleção ${colName}:`, e);
    }
  }

  // Clear all local states/accounts as well
  localStorage.clear();
  sessionStorage.clear();
}

