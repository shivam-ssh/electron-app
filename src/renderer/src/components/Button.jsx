import axios from 'axios'
import React, { useState } from 'react'

const Button = () => {
  const [data, setData] = useState('')
  const getData = async () => {
    const a = await axios.get('http://localhost:3300/')
    setData(a)
  }
  return (
    <>
      <button onClick={getData}>3.0.80</button>
      {window.downloadProgress}
      {data.data}
    </>
  )
}

export default Button
