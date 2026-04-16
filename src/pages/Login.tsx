import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
        });
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                navigate("/dashboard");
            }
        });
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h1>MoneyBall</h1>
            <button onClick={handleLogin}>
                Sign in with Google
            </button>
        </div>
    );
}