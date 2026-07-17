import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
export default function AdminLayout() { return <div className="aurora flex min-h-screen"><Sidebar admin/><main className="min-w-0 flex-1 p-5 md:p-8"><Outlet/></main></div> }
