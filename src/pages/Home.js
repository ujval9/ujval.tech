import { collection, deleteDoc, onSnapshot,doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import BlogSection from '../components/BlogSection'
import { db } from '../firebase'
import Spinner from "../components/Spinner"
import Tags from '../components/Tags'
import MostPopular from '../components/MostPopular'
import Trending from '../components/Trending'

const Home = ({setActive,user}) => {
  const [blogs,setBlogs] = useState([])
  const [tags,setTags] = useState([])
  const [loading , setLoading] = useState(true)
  const [trendBlogs,setTrendBlogs] =useState([])

  const getTrendingBlogs = async()=>{
    const blogRef = collection(db,"blogs")
    const trendQuery = query(blogRef,where("trending", "==","yes"))
    const querySnapshot = await getDocs(trendQuery)
    let trendBlogs = []
    querySnapshot.forEach((doc)=>{
      trendBlogs.push({id: doc.id, ...doc.data()})
    })

    setTrendBlogs(trendBlogs)
  }

  useEffect(()=>{
    getTrendingBlogs()
const unsub = onSnapshot(
  collection(db,"blogs"),(snapshot)=>{
    let list= []
    let tags = []
    snapshot.docs.forEach((doc)=>{
      tags.push(...doc.get('tags'))
      list.push({id: doc.id, ...doc.data()})
    })
    const uniqueTags = [...new Set(tags)]
    setTags(uniqueTags)
    setBlogs(list)
    setLoading(false)
    setActive("home")
  
  },(err)=>{
    console.log(err);
  }
)
return ()=>{
  unsub()
  getTrendingBlogs()
}
  },[setActive])

  if(loading){
    return <Spinner/>
  }

  const handleDelete = async (id)=>{
        if(window.confirm("are you sure want to delete that blog?")){
          try{
                setLoading(true)
                await deleteDoc(doc(db,"blogs",id))
                toast.success("Blog Deleted Succesfully")
                setLoading(false);

          }
          catch(err){
               console.log(err)
          }
        }
  }

  

  return (
    <div className='container-fluid pb-4 pt-4 padding'>
      <div className="container padding">
        <div className="row mx-0">
       <Trending blogs={trendBlogs}/>
          <div className="col-md-8">
           <BlogSection blogs = {blogs} handleDelete ={handleDelete} user={user}/>
          </div>
          <div className="col-md-3">
           <Tags tags={tags}/>
           <MostPopular blogs={blogs}/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home