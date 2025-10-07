import React, { useState, useEffect } from 'react';
import styles from "@/styles/Contacts.module.css";
import { supabase } from "@/lib/supabaseClient";

// DB
interface Contact {
  name: string;
  email: string;
  status: string;
  location?: string | null;
  created_at: string;
}

const Contacts: React.FC = () => {
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*');

        if (error) throw error;
        if (data) setContacts(data);
      } catch (err: any) {
        console.error('Error fetching contacts:', err.message);
      }
    };

    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    switch (sortBy) {
      case 'name-az':
        return a.name.localeCompare(b.name);
      case 'name-za':
        return b.name.localeCompare(a.name);
      case 'email-az':
        return a.email.localeCompare(b.email);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className={styles.contactsContainer}>
      <div className={styles.searchRow}>
        <input
          type="text"
          placeholder="Name, Email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="name-az">Sort by: Name A-Z</option>
          <option value="name-za">Sort by: Name Z-A</option>
          <option value="email-az">Sort by: Email A-Z</option>
          <option value="newest">Sort by: Newest first</option>
          <option value="oldest">Sort by: Oldest first</option>
        </select>
        <button className={styles.exportBtn}>
          Export
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.contactsTable}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.checkboxColumn}>
                <input type={styles.checkbox} />
              </th>
              <th className={styles.nameColumn}>Name</th>
              <th className={styles.emailColumn}>Email</th>
              <th className={styles.statusColumn}>Status</th>
              <th className={styles.locationColumn}>Location</th>
              <th className= {styles.timeColumn}>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  {searchQuery
                    ? 'No contacts match your search criteria.'
                    : 'No contacts available.'}
                </td>
              </tr>
            ) : (
              sortedContacts.map((contact) => (
                <tr key={contact.name} className={styles.tableRow}>
                  <td className={styles.checkboxCell}>
                    <input type={styles.checkboxInput} />
                  </td>
                  <td className={styles.nameCell}>
                    <div className={styles.contactInfo}>
                      <div className={styles.avatar}>
                        {contact.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </div>
                      <div className={styles.contactDetails}>
                        <div className={styles.contactName}>{contact.name}</div>
                        <div className={styles.contactEmail}>{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.emailCell}>{contact.email}</td>
                  <td className={styles.statusCell}>
                    <span
                      className={`{styles.statusBadge}${
                        contact.status === 'Active'
                          ? 'status-active'
                          : 'status-inactive'
                      }`}
                    >
                      {contact.status}
                    </span>
                  </td>
                  <td className={styles.locationCell}>
                    {contact.location || 'N/A'}
                  </td>
                  <td className={styles.dateCell}>
                    {contact.created_at
                      ? new Date(contact.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Contacts;
