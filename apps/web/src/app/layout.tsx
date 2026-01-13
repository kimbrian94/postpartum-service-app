import React from 'react';
import Navbar from '../components/layout/navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <footer className="bg-gray-800 text-white text-center p-4">
                &copy; {new Date().getFullYear()} Postpartum Service Management
            </footer>
        </div>
    );
};

export default Layout;