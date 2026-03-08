import React, { useState } from 'react';
import {
    Globe,
    Search,
    ExternalLink,
    Terminal,
    Building2,
    School,
    Utensils,
    LayoutDashboard,
    FlaskConical,
    Cpu,
    GraduationCap,
    Network
} from 'lucide-react';
import './OurProjects.css';

const APPLICATIONS = [

    {
        id: 2,
        name: 'Local Site',
        port: 91,
        url: 'http://SERVER_IP:91',
        description: 'Internal local project website.',
        icon: Building2,
        category: 'Internal'
    },
    {
        id: 3,
        name: 'NGK',
        port: 92,
        url: 'http://SERVER_IP:92',
        description: 'NGK project website.',
        icon: Building2,
        category: 'Project'
    },
    {
        id: 4,
        name: 'School',
        port: 93,
        url: 'http://SERVER_IP:93',
        description: 'School management website.',
        icon: School,
        category: 'Management'
    },
    {
        id: 5,
        name: 'EasyRasta',
        port: 94,
        url: 'http://SERVER_IP:94',
        description: 'EasyRasta business website.',
        icon: Globe,
        category: 'Business'
    },
    {
        id: 6,
        name: 'FoodApp Frontend',
        port: 9095,
        url: 'http://SERVER_IP:9095',
        description: 'Customer facing food ordering application built with React.',
        icon: Utensils,
        category: 'Application'
    },
    {
        id: 7,
        name: 'FoodApp Admin',
        port: 9096,
        url: 'http://SERVER_IP:9096',
        description: 'Admin dashboard for managing food app.',
        icon: LayoutDashboard,
        category: 'Admin'
    },
    {
        id: 8,
        name: 'Stenna Admin',
        port: 9097,
        url: 'http://SERVER_IP:9097',
        description: 'Admin panel for Stenna platform.',
        icon: LayoutDashboard,
        category: 'Admin'
    },
    {
        id: 9,
        name: 'Stenna Website',
        port: 9098,
        url: 'http://SERVER_IP:9098',
        description: 'Public website for Stenna platform.',
        icon: Globe,
        category: 'Website'
    },
    {
        id: 10,
        name: 'VitalScience',
        port: 9099,
        url: 'http://SERVER_IP:9099',
        description: 'VitalScience healthcare platform.',
        icon: FlaskConical,
        category: 'Healthcare'
    },
    {
        id: 11,
        name: 'Fornix',
        port: 9100,
        url: 'http://SERVER_IP:9100',
        description: 'Fornix platform.',
        icon: Cpu,
        category: 'Platform'
    },
    {
        id: 12,
        name: 'MED AI LMS',
        port: 9101,
        url: 'http://SERVER_IP:9101',
        description: 'AI powered medical learning management system.',
        icon: GraduationCap,
        category: 'AI / LMS'
    },
    {
        id: 13,
        name: 'Connect App',
        port: 9102,
        url: 'http://SERVER_IP:9102',
        description: 'Connect frontend React application.',
        icon: Network,
        category: 'Application'
    }
];

const OurProjects = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Use the specific server IP provided by the user (31.97.232.232)
    const host = window.location.hostname === 'localhost' ? '31.97.232.232' : window.location.hostname;

    const filteredApps = APPLICATIONS.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenApp = (url) => {
        // Replace placeholder with actual current host
        const finalUrl = url.replace('SERVER_IP', host);
        window.open(finalUrl, '_blank');
    };

    return (
        <div className="our-projects-container">
            <header className="page-header">
                <div>
                    <h1>Our Applications</h1>
                    <p>Internal and External applications developed by our company</p>
                </div>

                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="apps-grid">
                {filteredApps.map(app => (
                    <div key={app.id} className="app-card">
                        <div className="app-card-header">
                            <div className="app-icon-wrapper">
                                <app.icon size={24} color="var(--accent)" />
                            </div>
                            <span className="port-badge">Port: {app.port}</span>
                        </div>

                        <div className="app-card-body">
                            <h3>{app.name}</h3>
                            <span className="category-tag">{app.category}</span>
                            <p>{app.description}</p>
                        </div>

                        <div className="app-card-footer">
                            <button
                                className="open-app-btn"
                                onClick={() => handleOpenApp(app.url)}
                            >
                                <ExternalLink size={16} />
                                Open Application
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredApps.length === 0 && (
                <div className="no-results">
                    <Search size={48} color="var(--text-muted)" />
                    <h3>No applications found</h3>
                    <p>Try refining your search term.</p>
                </div>
            )}
        </div>
    );
};

export default OurProjects;
