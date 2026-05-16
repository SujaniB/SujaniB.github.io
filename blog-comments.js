import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const root = document.querySelector("[data-comments]");
const fallbackAvatar = new URL("assets/profile-placeholder.jpg", import.meta.url).href;

if (root) {
  const firebaseConfig = window.BLOG_COMMENTS_CONFIG?.firebase;
  const isConfigured = firebaseConfig && Object.values(firebaseConfig).every(Boolean);
  const postSlug = root.dataset.postSlug || window.location.pathname.split("/").pop();
  const status = root.querySelector("[data-comments-status]");
  const signInButton = root.querySelector("[data-google-sign-in]");
  const userPanel = root.querySelector("[data-comment-user]");
  const userPhoto = root.querySelector("[data-comment-user-photo]");
  const userName = root.querySelector("[data-comment-user-name]");
  const signOutButton = root.querySelector("[data-google-sign-out]");
  const form = root.querySelector("[data-comment-form]");
  const textarea = root.querySelector("textarea[name='comment']");
  const list = root.querySelector("[data-comment-list]");

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const renderEmpty = (message) => {
    if (!list) return;
    list.replaceChildren();
    const item = document.createElement("li");
    item.className = "blog-comment-empty";
    item.textContent = message;
    list.append(item);
  };

  const formatCommentDate = (value) => {
    const date = value?.toDate ? value.toDate() : new Date();
    return new Intl.DateTimeFormat([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const renderComments = (snapshot) => {
    if (!list) return;
    list.replaceChildren();

    if (snapshot.empty) {
      renderEmpty("No comments yet. Be the first note in the margin.");
      return;
    }

    snapshot.forEach((doc) => {
      const comment = doc.data();
      const item = document.createElement("li");
      item.className = "blog-comment-item";

      const header = document.createElement("div");
      header.className = "blog-comment-meta";

      const avatar = document.createElement("img");
      avatar.alt = "";
      avatar.src = comment.authorPhoto || fallbackAvatar;

      const author = document.createElement("div");
      author.className = "blog-comment-author";

      const name = document.createElement("strong");
      name.textContent = comment.authorName || "Google user";

      const time = document.createElement("time");
      time.textContent = formatCommentDate(comment.createdAt);

      const body = document.createElement("p");
      body.textContent = comment.text || "";

      author.append(name, time);
      header.append(avatar, author);
      item.append(header, body);
      list.append(item);
    });
  };

  if (!isConfigured) {
    signInButton.hidden = true;
    form.hidden = true;
    setStatus("Comments need Firebase Google sign-in setup before they can go live.");
    renderEmpty("Add your Firebase web app config in blog-comments-config.js.");
  } else {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    const db = getFirestore(app);
    const commentsRef = collection(db, "blogComments", postSlug, "comments");
    const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"), limit(50));

    onSnapshot(commentsQuery, renderComments, (error) => {
      const code = error?.code ? ` (${error.code})` : "";
      setStatus(`Could not load comments${code}. Check Firestore rules for this project.`);
      renderEmpty("Comments are temporarily unavailable.");
    });

    signInButton.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        const code = error?.code ? ` (${error.code})` : "";
        setStatus(`Google sign-in was not completed${code}.`);
      }
    });

    signOutButton.addEventListener("click", () => {
      signOut(auth);
    });

    onAuthStateChanged(auth, (user) => {
      const isSignedIn = Boolean(user);
      signInButton.hidden = isSignedIn;
      userPanel.hidden = !isSignedIn;
      form.hidden = !isSignedIn;

      if (isSignedIn) {
        userName.textContent = user.displayName || user.email || "Signed in";
        userPhoto.src = user.photoURL || fallbackAvatar;
        setStatus("Signed in with Google. Your comment will appear here after posting.");
      } else {
        setStatus("Sign in with Google to leave a pencil note.");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = auth.currentUser;
      const text = textarea.value.trim();
      if (!user || !text) return;

      const submitButton = form.querySelector("button[type='submit']");
      submitButton.disabled = true;
      setStatus("Posting your comment...");

      try {
        await addDoc(commentsRef, {
          uid: user.uid,
          authorName: user.displayName || user.email || "Google user",
          authorPhoto: user.photoURL || "",
          text,
          createdAt: serverTimestamp(),
        });
        textarea.value = "";
        setStatus("Comment posted.");
      } catch (error) {
        const code = error?.code ? ` (${error.code})` : "";
        setStatus(`Could not post the comment${code}. Check Firestore rules and try again.`);
      } finally {
        submitButton.disabled = false;
      }
    });
  }
}
