export function requireAuth(req, res, next) {
    if (req.session?.user) return next();
    return res.status(401).json({ message: "No has iniciado sesión" });
}

export function requireAdmin(req, res, next) {
    if (req.session?.user?.role === "admin") return next();
    return res.status(403).json({ message: "Solo administradores" });
}
