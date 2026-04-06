import { createBrowserRouter,createRoutesFromElements, RouterProvider,Route } from "react-router"
import Landing from "./pages/Landing"
import Test from "./pages/Test"
import TestMobile from "./pages/TestMobile"
import { useEffect,useState } from "react"

export default function App() {

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const router = createBrowserRouter(
  createRoutesFromElements(
    <>
    <Route path="/" element={<Landing />} />
    <Route path="/chat" element={isMobile ? <TestMobile /> : <Test />} />
    </>
  )
)
  return(
     <>
     <RouterProvider router={router} />
     </>
  )
  
  
}