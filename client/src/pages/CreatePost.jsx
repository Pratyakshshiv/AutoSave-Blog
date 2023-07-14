import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Editor from "../components/Editor";
import axios from "axios";

export default function CreatePost() {
  const [id, setId] = useState(null);
  const [cover, setCover] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState("");
  const [redirect, setRedirect] = useState(false);
  // Create Post Manually
  const createNewPost = async (ev) => {
    ev.preventDefault();
    if (!id) {
      return toast.info("Type something first");
    }
    const data = new FormData();
    data.set("title", title);
    data.set("summary", summary);
    data.set("content", content);
    data.set("id", id);
    const response = await axios.put("/post", data);
    setRedirect(true);
  };
  // Remove Cover Photo
  const clearPhoto = async (e) => {
    e.preventDefault();
    if (!cover || !id) return;
    const PhotoData = new FormData();
    PhotoData.set("url", cover);
    PhotoData.set("id", id);
    await axios.put("/delete/cover", { id, cover });
    setCover(null);
    setFiles(null);
    // If post had nothing except cover and cover is now deleted
    // So post is empty therefore delete Post
    if (title.length < 1 && summary.length < 1 && content.length < 1) {
      toast.dismiss();
      toast.info("Deleting Post");
      axios.delete("/post/" + id).then((response) => {
        setId(null);
        toast.dismiss();
        toast.success("Post Deleted");
      });
    }
  };
  // Auto Save For Photo
  useEffect(() => {
    if (!files || files?.length === 0) {
      return;
    }
    // If Post already Created then update
    if (id) {
      const PhotoData = new FormData();
      PhotoData.set("id", id);
      PhotoData.set("file", files[0]);
      axios.put("/post/photo", PhotoData).then((response) => {
        console.log(response);
        setCover(response.data);
      });
      toast.dismiss();
      toast.success("Photo Uploaded");
    }
    // If no Id then post is not Present so Create post with this cover
    if (!id) {
      const PhotoData = new FormData();
      PhotoData.set("file", files[0]);
      axios.post("/post/photo", PhotoData).then((response) => {
        setCover(response.data.cover);
        setId(response.data._id);
      });
      toast.dismiss();
      toast.success("Post Saved");
    }
  }, [files]);
  // Auto Save for Text with timer of 3sec
  useEffect(() => {
    let timerOut = setTimeout(() => {
      // If nothing written then delete post
      if (title.length < 1 && summary.length < 1 && content.length < 1) {
        if (!cover && id) {
          toast.dismiss();
          toast.info("Deleting Post");
          axios.delete("/post/" + id).then((response) => {
            setId(null);
            toast.dismiss();
            toast.success("Post Deleted");
          });
        }
        return;
      }
      // If Nothing is Written so there is no id so create a blog
      if (!id) {
        toast.dismiss();
        toast.info("Saving Data");
        const data = new FormData();
        data.set("title", title);
        data.set("summary", summary);
        data.set("content", content);
        data.set("file", files[0]);
        axios.post("/post", data).then((response) => {
          setId(response.data._id);
          toast.dismiss();
          toast.success("Data Saved");
        });
      }
      // If something is written So Id is present so update the blog
      if (id) {
        toast.dismiss();
        toast.info("Saving Data");
        axios.put("/post", { id, title, summary, content }).then((response) => {
          toast.dismiss();
          toast.success("Data Saved");
        });
      }
    }, 3000);
    return () => clearTimeout(timerOut);
  }, [title, summary, content]);
  // If clicked on Create Post then Redirect to HomePage
  if (redirect) {
    return <Navigate to={"/"} />;
  }
  return (
    <form onSubmit={createNewPost}>
      <input
        type="title"
        placeholder={"Title"}
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
      />
      <input
        type="summary"
        placeholder={"Summary"}
        value={summary}
        onChange={(ev) => setSummary(ev.target.value)}
      />
      <input type="file" onChange={(ev) => setFiles(ev.target.files)} />
      {/* If cover then show Cover and option for remove Cover */}
      {cover && (
        <div className="edit-page">
          <img className="edit-image" src={cover} alt="" />
          <button onClick={clearPhoto} className="clear-image">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
      )}
      {/* Rich Text Editor */}
      <Editor value={content} onChange={setContent} />
      <button style={{ marginTop: "5px" }}>Create post</button>
      <ToastContainer />
    </form>
  );
}
