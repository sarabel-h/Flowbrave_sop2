## **Rules to Follow**  

### **General Development Guidelines**  
- Stay completely focused on implementing the task at hand.  
- Follow the **most standard approach recommended by Next.js 15 documentation**.  
- Always consider the full picture to ensure that even the smallest existing feature remains intact.  
- **Do not optimize** any other part of the application code unless explicitly instructed.  
- **Do not refactor** any other part of the application code unless explicitly instructed.  
- **Do not make any changes** to any other UI, effects, flow, features, or functionalities.  
- **Do not break any other part** of the UI/UX, flow, features, or functionalities.  
- Keep it **simple and maintainable**, do not overcomplicate things.  
- **Do not reinvent the wheel**—always use **standard Next.js 15 best practices** and established patterns.  

### **UI & Styling Guidelines**  
- **Use Tailwind CSS for all styling**—avoid custom CSS files unless absolutely necessary.  
- **Follow a mobile-first approach**—always design for small screens first, then scale up.  
- **Prefer using shadcn UI components** whenever possible.  
- **If a new shadcn UI component is added**, convert it to **JavaScript** before integrating it into the project.  
- Ensure all UI elements are **responsive, accessible, and visually consistent**.  

### **Component & Code Structure**  
- **React components must not exceed 300 lines**—use a **modular approach** to improve maintainability.  
- **Break features into reusable pieces** to ensure fixes and changes don’t affect unrelated areas.  
- If a file becomes too long, **split it into smaller files**.  
- If a function becomes too long, **split it into smaller functions**.  
- **Use JavaScript (not TypeScript)** for all components.  
- **Keep all logic inside appropriate hooks and utility functions** instead of cluttering components.  

### **Code Implementation & Best Practices**  
- **Always use the Next.js app router (`app/` directory)** and follow the official guidelines.  
- Use **server components** where necessary for performance optimization, but keep the UI interactive with **client components**.  
- **Use Next.js API routes** for backend logic where applicable.  
- Ensure **SEO best practices** (e.g., `<meta>` tags, Open Graph tags) when working with pages.  
- **Lazy-load components and images** where applicable to improve performance.  
- Use **environment variables (`.env.local`)** for sensitive data—never hardcode credentials.  
- **Use absolute imports (`@/components`, `@/utils`)** instead of relative imports like `../../`.  

### **Development Workflow**  
- **When planning a complex code change**, always start with a **plan of action** and ask for approval before proceeding.  
- **For simple changes**, implement them directly but **always think carefully and step-by-step** before making modifications.  
- **When debugging a problem**, ensure you have sufficient information to deeply understand it before attempting a fix.  
- **Test all changes thoroughly** before committing—ensure no UI/UX regressions occur.  
- Keep **code clean, readable, and well-commented** where necessary.  

