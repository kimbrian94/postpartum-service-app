import React from 'react';
import Link from 'next/link';

const Navbar = () => {
    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white text-lg font-bold">Postpartum Service</div>
                <div className="space-x-4">
                    <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
                    <Link href="/appointments" className="text-gray-300 hover:text-white">Appointments</Link>
                    <Link href="/clients" className="text-gray-300 hover:text-white">Clients</Link>
                    <Link href="/services" className="text-gray-300 hover:text-white">Services</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;