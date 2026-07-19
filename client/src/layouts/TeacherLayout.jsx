import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function TeacherLayout() {
  return <div className="aurora min-h-screen"><Sidebar teacher fixed /><div className="min-w-0 lg:ml-64"><main className="p-5 md:p-8"><Outlet /></main></div></div>
}
