import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import api from "../api/axios";
import { setToken } from "../api/auth";

const fields = [
  ["name", "Name", "text"], ["phone", "Phone Number", "tel"], ["email", "Email", "email"],
  ["password", "Password", "password"], ["address", "Address", "text"], ["city", "City", "text"],
  ["pincode", "Pincode", "text"], ["cls", "Class", "text"], ["school", "School Name", "text"],
];

export default function SellerRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const f = e.target.elements;
    const payload = {
      name: f.name.value,
      phone: f.phone.value,
      email: f.email.value,
      password: f.password.value,
      address: f.address.value,
      city: f.city.value,
      pincode: f.pincode.value,
      class: f.cls.value,
      schoolName: f.school.value,
    };

    try {
      await api.post("/auth/register/seller", payload);

      // Auto-login right after successful registration
      const loginRes = await api.post("/auth/login", {
        email: payload.email,
        password: payload.password,
      });
      const { user, token } = loginRes.data;

      setToken(token);
      dispatch(login({ role: user.role, name: user.name, email: user.email, id: user.id }));
      navigate("/seller");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-ink text-center">Register as a Seller</h1>
      <p className="text-muted text-center mt-2 text-sm">Start selling your used books in minutes.</p>
      <form onSubmit={handleSubmit} className="bg-white border border-mint-line rounded-2xl p-6 mt-8 grid sm:grid-cols-2 gap-4">
        {fields.map(([id, label, type]) => (
          <div key={id} className={id === "address" ? "sm:col-span-2" : ""}>
            <label className="text-xs font-medium text-muted block mb-1">{label}</label>
            <input name={id} required type={type} className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest" />
          </div>
        ))}
        {error && <p className="sm:col-span-2 text-rose text-sm font-medium">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 bg-forest text-white font-semibold py-2.5 rounded-lg hover:bg-forest-dark transition mt-2 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Submit"}
        </button>
      </form>
    </div>
  );
}