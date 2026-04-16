import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h2>Dashboard</h2>
            <p>{user?.email}</p>
        </div>
    );
}