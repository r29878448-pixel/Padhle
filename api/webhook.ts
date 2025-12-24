
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Re-initialize for the serverless function environment
const firebaseConfig = {
  apiKey: "AIzaSyA6PnAaf-88DuVVY9oOdKLLTAEZ12Akq74",
  authDomain: "study-portal-a054a.firebaseapp.com",
  projectId: "study-portal-a054a",
  storageBucket: "study-portal-a054a.firebasestorage.app",
  messagingSenderId: "463373408496",
  appId: "1:463373408496:web:09b81a98b2d17249c18a35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    // Handle both private messages and channel posts
    const message = update.message || update.channel_post;

    if (!message) {
      return res.status(200).send('No message payload');
    }

    let title = message.caption || message.text || "New Telegram Resource";
    let url = "";
    let type: 'youtube' | 'video' | 'pdf' | 'text' = 'text';

    // 1. Check for Youtube links
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const contentText = (message.text || message.caption || "");
    const ytMatch = contentText.match(ytRegex);
    
    if (ytMatch) {
      url = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
      type = 'youtube';
    } 
    // 2. Handle PDF Documents
    else if (message.document && message.document.mime_type === 'application/pdf') {
      // In a production bot, you'd use the file_id to get a persistent URL
      // For this implementation, we store the fileId which can be resolved later
      url = `https://api.telegram.org/file/bot8583018978:AAEpnalhEGhUE1T3lBfuGiBb7TJeT-sfL_E/${message.document.file_id}`;
      title = message.document.file_name || title;
      type = 'pdf';
    }
    // 3. Handle Videos
    else if (message.video) {
      url = `https://api.telegram.org/file/bot8583018978:AAEpnalhEGhUE1T3lBfuGiBb7TJeT-sfL_E/${message.video.file_id}`;
      type = 'video';
    }

    // Only save if we found a valid resource URL
    if (url) {
      await addDoc(collection(db, "telegram_feed"), {
        title,
        url,
        type,
        timestamp: Date.now(),
        isIngested: false
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
