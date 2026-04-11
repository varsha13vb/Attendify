import React, { useState } from 'react';
import axios from 'axios';

const SystemConfig = ({ showNotify }) => {
    const [settings, setSettings] = useState({ notifications: true, maintenance: false });

    const handleSave = async () => {
        try {
            await axios.put("http://127.0.0.1:5000/api/admin/config", settings, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            showNotify("System Settings Updated");
        } catch (err) { showNotify("Update failed", "error"); }
    };

    return (
        <div style={{background:'#fff', padding:'2em', borderRadius:'1.2em', maxWidth:'500px'}}>
            <h3>System Configuration</h3>
            <div style={{margin:'20px 0'}}>
                <label>
                    <input type="checkbox" checked={settings.notifications} onChange={e => setSettings({...settings, notifications: e.target.checked})}/>
                    Enable Email Notifications
                </label>
            </div>
            <div style={{margin:'20px 0'}}>
                <label>
                    <input type="checkbox" checked={settings.maintenance} onChange={e => setSettings({...settings, maintenance: e.target.checked})}/>
                    Maintenance Mode
                </label>
            </div>
            <button style={{background:'#7D3C98', color:'#fff', padding:'10px 20px', border:'none', borderRadius:'5px'}} onClick={handleSave}>
                Save Configuration
            </button>
        </div>
    );
};

export default SystemConfig;