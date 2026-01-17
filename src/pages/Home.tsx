import { useEffect, useState } from "react"

type Rumah = {
  id: number
  nama: string
  alamat: string
  harga: number
}

function Home() {
  const [data, setData] = useState<Rumah[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:3000/api/rumah")
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 20 }}>
      <h1>Data Rumah</h1>

      {data.map(r => (
        <div key={r.id} style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          <h3>{r.nama}</h3>
          <p>{r.alamat}</p>
          <strong>Rp {r.harga}</strong>
        </div>
      ))}
    </div>
  )
}

export default Home
