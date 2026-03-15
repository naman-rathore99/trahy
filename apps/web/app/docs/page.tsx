import Image from 'next/image';
import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Link
        rel="stylesheet"
        href="https://res.cloudinary.com/dxlw574rm/image/upload/v1773572849/WhatsApp_Image_2026-03-15_at_1.06.06_PM_z5g4hy.jpg"
      >
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          View Image
              </button>
              
          </Link>
          <Image src={"/temp.png"}  alt='qr' width={500} height={300}/>
    </div>
  );
}

export default page