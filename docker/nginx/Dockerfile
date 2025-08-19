FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates if needed
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]