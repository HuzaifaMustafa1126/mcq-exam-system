import { Outlet } from 'react-router-dom'
import AdminTopbar from '../components/AdminTopbar'
import Sidebar from '../components/Sidebar'
export default function AdminLayout() { return <div className="aurora min-h-screen"><Sidebar admin fixed/><div className="min-w-0 lg:ml-64"><AdminTopbar/><main className="p-5 md:p-8"><Outlet/></main></div></div> }
