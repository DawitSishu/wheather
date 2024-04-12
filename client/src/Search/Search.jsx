import React, { useState } from 'react'
import axios from 'axios'
import {useHistory} from 'react-router-dom'
import './Search.css'
function Search() {
   const [location, setLocation] = useState("")
   const history = useHistory()
   const clicked =()=>{
      localStorage.setItem("location",location)
      console.log(localStorage)
      axios.get(`http://api.weatherapi.com/v1/current.json?key=d1fa0f5579cb4097a48171654241204&q=${localStorage.getItem("location")}&aqi=no`).then((Response)=>{
               
        history.push("/Result")
    }).catch((error)=>{
        alert(error.message)
    })
   }
    return (
        <div className="Search">
            <div className="SearchBox">
                <input type="text" className="search" onChange={(e)=>setLocation(e.target.value)} name="search" id="Search" placeholder="Search by your city name ......" />
                <h2><i class="fas fa-search-location" onClick={clicked}></i></h2>
            </div>
        </div>
    )
}

export default Search
