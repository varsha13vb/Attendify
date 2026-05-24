import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const EmployeeManagement = ({ showNotify }) => {
    // State for employee data, search, and action menus.
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState(null);

    // State for add, edit, and delete employee workflows.
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', dob: '', employee_id: '' });

    // API configuration for protected employee management requests.
    const token = localStorage.getItem("token");
    const config = useMemo(() => {
        return { headers: { Authorization: `Bearer ${token}` } };
    }, [token]);
    const API_URL = "http://127.0.0.1:5000/api/admin/employees";
    const filteredEmployees = useMemo(() => {
        const term = (searchTerm || "").trim().toLowerCase();
        if (!term) return employees;

        return employees.filter((emp) => {
            const name = String(emp?.name || "").toLowerCase();
            const employeeId = String(emp?.employee_id || "").toLowerCase();
            const email = String(emp?.email || "").toLowerCase();

            return (
                name.includes(term) ||
                employeeId.includes(term) ||
                email.includes(term)
            );
        });
    }, [employees, searchTerm]);

    // Data loading and CRUD handlers for employee records.
    const fetchEmployees = useCallback(async () => {
        try {
            const res = await axios.get(API_URL, config);
            setEmployees(res.data);
        } catch {
            showNotify("Failed to fetch employees", "error");
        }
    }, [config, showNotify]);

    useEffect(() => {
        const fetchTimer = setTimeout(() => {
            fetchEmployees();
        }, 0);
        const closeMenu = () => setOpenDropdownId(null);
        window.addEventListener('click', closeMenu);
        return () => {
            clearTimeout(fetchTimer);
            window.removeEventListener('click', closeMenu);
        };
    }, [fetchEmployees]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            // Password is automatically set to DOB.
            const payload = { ...formData, password: formData.dob };
            await axios.post(API_URL, payload, config);
            showNotify("Account created & Email sent to employee");
            setIsAddOpen(false);
            setFormData({ name: '', email: '', dob: '', employee_id: '' });
            fetchEmployees();
        } catch (err) {
            showNotify(err.response?.data?.message || "Add failed", "error");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/${formData.id}`, formData, config);
            showNotify("Employee details updated");
            setIsEditOpen(false);
            fetchEmployees();
        } catch {
            showNotify("Update failed", "error");
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/${deleteItem.id}`, config);
            showNotify("Employee removed from database");
            setDeleteItem(null);
            fetchEmployees();
        } catch {
            showNotify("Delete failed", "error");
        }
    };

    return (
        <div style={styles.container}>
            {/* Header section with page title and add action */}
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Employee Management</h2>
                    <p style={styles.sub}>Manage staff records and system access</p>
                </div>
                <button style={styles.addBtn} onClick={() => setIsAddOpen(true)}>+ Add Employee</button>
            </div>

            {/* Search section for filtering employees by name, ID, or email */}
            <div style={styles.searchContainer}>
                <input
                    style={styles.pillSearch}
                    placeholder="Search by employee name, ID..."
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Employee table section with row-level edit and delete actions */}
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Employee</th>
                            <th style={styles.th}>Contact</th>
                            <th style={styles.th}>Join Date</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp, index) => {
                            const shouldOpenUpward = index >= Math.max(filteredEmployees.length - 2, 0);

                            return (
                                <tr key={emp.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.userCell}>
                                            <div style={styles.avatar}>{emp.name[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: '700' }}>{emp.name}</div>
                                                <div style={{ fontSize: '0.8em', color: '#888' }}>{emp.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{emp.email}</td>
                                    <td style={styles.td}>{emp.created_at}</td>
                                    <td style={styles.td}><span style={styles.statusBadge}>Active</span></td>
                                    <td style={styles.td}>
                                        <div style={styles.actionWrap}>
                                            <button
                                                style={styles.dots}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(openDropdownId === emp.id ? null : emp.id);
                                                }}
                                            >
                                                &#8942;
                                            </button>
                                            {openDropdownId === emp.id && (
                                                <div
                                                    style={{
                                                        ...styles.dropdown,
                                                        ...(shouldOpenUpward ? styles.dropdownUp : styles.dropdownDown),
                                                    }}
                                                >
                                                    <div
                                                        style={styles.dropItem}
                                                        onClick={() => {
                                                            setFormData(emp);
                                                            setIsEditOpen(true);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        Edit
                                                    </div>
                                                    <div
                                                        style={styles.dropItemDanger}
                                                        onClick={() => {
                                                            setDeleteItem(emp);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        Delete
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add and edit employee modal section */}
            {(isAddOpen || isEditOpen) && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3>{isAddOpen ? "Add New Employee" : "Edit Employee"}</h3>
                        <form onSubmit={isAddOpen ? handleAdd : handleUpdate}>
                            <label style={styles.label}>Full Name</label>
                            <input style={styles.input} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />

                            <label style={styles.label}>Email Address</label>
                            <input style={styles.input} type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />

                            <label style={styles.label}>Employee ID</label>
                            <input style={styles.input} required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} />

                            <label style={styles.label}>Date of Birth (Password will be set to this)</label>
                            <input style={styles.input} type="date" required value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />

                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    style={styles.cancelBtn}
                                    onClick={() => {
                                        setIsAddOpen(false);
                                        setIsEditOpen(false);
                                        setFormData({ name: '', email: '', dob: '', employee_id: '' });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={styles.saveBtn}>Save Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal section */}
            {deleteItem && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, width: '350px', textAlign: 'center' }}>
                        <h3 style={{ color: '#dc2626' }}>Delete Employee</h3>
                        <p>Are you sure you want to delete <b>{deleteItem.name}</b>?</p>
                        <p style={{ fontSize: '0.8em', color: 'red' }}>This action cannot be undone.</p>
                        <div style={{ ...styles.modalActions, justifyContent: 'center', marginTop: '20px' }}>
                            <button style={styles.cancelBtn} onClick={() => setDeleteItem(null)}>Cancel</button>
                            <button style={{ ...styles.saveBtn, background: '#dc2626' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Centralized styles for the employee management page.
const styles = {
    container: { padding: '10px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { margin: 0, color: '#333' },
    sub: { margin: 0, color: '#666', fontSize: '0.9em' },
    addBtn: { background: 'linear-gradient(to right, #7D3C98, #5B2C6F)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    searchContainer: { marginBottom: '20px' },
    pillSearch: { width: '100%', padding: '14px 25px', borderRadius: '50px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' },
    card: { background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '18px', background: '#F8F9FA', color: "var(--text)", fontSize: '12px', textTransform: 'uppercase' },
    td: { padding: '18px', borderBottom: '1px solid #eee' },
    userCell: { display: 'flex', alignItems: 'center', gap: '15px' },
    avatar: { width: '40px', height: '40px', background: '#E9D5FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#7D3C98' },
    statusBadge: { background: '#E8F5E9', color: '#2E7D32', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
    actionWrap: { position: 'relative' },
    dots: { background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#999' },
    dropdown: { position: 'absolute', right: 0, background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '10px', zIndex: 10, width: '150px' },
    dropdownDown: { top: '30px' },
    dropdownUp: { bottom: '30px' },
    dropItem: { padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: '14px' },
    dropItemDanger: { padding: '12px 20px', cursor: 'pointer', color: 'red', fontSize: '14px' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '2em', borderRadius: '1.5em', width: '450px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' },
    label: { fontSize: '0.85em', color: '#666', marginBottom: '5px', display: 'block' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    cancelBtn: {
        padding: '10px 20px',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        cursor: 'pointer',
        background: '#fee2e2',
        color: '#dc2626',
        fontWeight: '600'
    },
    saveBtn: { background: '#7D3C98', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default EmployeeManagement;
