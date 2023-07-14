import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchData } from "../redux/slice/blog";
import Post from "../components/Post";

const IndexPage = () => {
  // Redux Data fetching
  const posts = useSelector((state) => state);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchData());
  }, []);
  if (!posts?.blog?.data?.data?.length) return "";
  return (
    <>
      {posts.blog.data.data.length > 0 &&
        posts.blog.data.data.map((post) => <Post key={post._id} {...post} />)}
    </>
  );
};

export default IndexPage;
