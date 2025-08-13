export const accessControl = {
    admin: ["organization", "settings", "assign", "edit"],
    owner: ["user", "assign", "edit"],
    editor: ["user", "edit"],
    viewer: ["user"]
}

export const getRole = (role, email, sop = { assignedTo: [] }) => {
    
    // For admin role
    if(role === "org:admin") return "admin";

    // For member roles
    const assignedTo = sop.assignedTo.filter((item) => item.email === email);
    if(assignedTo.length) return assignedTo[0].role;

    // If no role is found, return lowest acces role
    return "viewer";
}

export const assignableRoles = ["Owner", "Editor", "Viewer"];