module.exports = {
  apps: [
    {
      name: "csi-kjsitlabs",
      cwd: "/root/CSI/repo",
      script: "npx",
      args: "vite preview --host 127.0.0.1 --port 4173 --strictPort",
      env: {
        NODE_ENV: "production",
        ADMIN_PASSWORD: "2345",
      },
      max_memory_restart: "512M",
      restart_delay: 2000,
    },
  ],
};
