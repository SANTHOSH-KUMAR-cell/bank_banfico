# 🏦 Bank Banfico

A secure and scalable Banking Management System developed using **Spring Boot**, **Spring Data JPA**, and **PostgreSQL**. This project provides REST APIs for managing bank accounts and performing banking operations such as account creation, deposits, withdrawals, and money transfers.

---

## 🚀 Features

- 👤 Customer Account Management
- 🏦 Create Bank Accounts
- 💰 Deposit Money
- 💸 Withdraw Money
- 🔄 Transfer Money Between Accounts
- 📄 View Account Details
- 📋 View All Accounts
- 🗑️ Delete Account
- ✅ Exception Handling
- 🗄️ PostgreSQL Database Integration
- ⚡ RESTful APIs

---

## 🛠️ Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Data JPA
- Hibernate
- Maven

### Database
- PostgreSQL

### Tools
- IntelliJ IDEA
- Postman
- Git & GitHub

---

## 📂 Project Structure

```
src
├── main
│   ├── java
│   │   └── com.banking.Bank
│   │       ├── controller
│   │       ├── service
│   │       ├── repository
│   │       ├── entity
│   │       ├── dto
│   │       ├── exception
│   │       └── BankApplication.java
│   └── resources
│       ├── application.properties
│       └── ...
```

---

## ⚙️ Prerequisites

Before running this project, install:

- Java 21 or above
- Maven
- PostgreSQL
- Git
- Postman (Optional)

---

## 🗄️ Database Setup

Create a PostgreSQL database.

```sql
CREATE DATABASE bank;
```

Update your `application.properties`.

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/bank
spring.datasource.username=postgres
spring.datasource.password=1234

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

## ▶️ Running the Project

### Clone the Repository

```bash
git clone https://github.com/SANTHOSH-KUMAR-cell/bank_banfico.git
```

### Navigate into Project

```bash
cd bank_banfico
```

### Build the Project

```bash
mvn clean install
```

### Run the Application

```bash
mvn spring-boot:run
```

Or run the `BankApplication.java` file directly from IntelliJ IDEA.

The server starts on

```
http://localhost:8080
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/accounts` | Create Account |
| GET | `/accounts` | Get All Accounts |
| GET | `/accounts/{id}` | Get Account by ID |
| PUT | `/accounts/{id}` | Update Account |
| DELETE | `/accounts/{id}` | Delete Account |
| POST | `/accounts/deposit` | Deposit Money |
| POST | `/accounts/withdraw` | Withdraw Money |
| POST | `/accounts/transfer` | Transfer Money |

> **Note:** Update the endpoints if your controller mappings are different.

---

## 📷 API Testing

Use **Postman** to test the REST APIs.

Example Request

```http
POST /accounts
```

Request Body

```json
{
    "accountHolderName":"Santhosh Kumar",
    "accountType":"SAVINGS",
    "balance":5000
}
```

Example Response

```json
{
    "id":1,
    "accountHolderName":"Santhosh Kumar",
    "accountType":"SAVINGS",
    "balance":5000
}
```

---

## 📌 Future Enhancements

- Spring Security Authentication
- JWT Authentication
- Role-Based Access Control
- Transaction History
- Email Notifications
- Swagger API Documentation
- Docker Support
- Unit Testing

---

## 📖 What I Learned

- Spring Boot Architecture
- REST API Development
- Spring Data JPA
- Hibernate ORM
- PostgreSQL Integration
- Exception Handling
- Layered Architecture
- Maven Project Management

---

## 👨‍💻 Author

**Santhosh Kumar**

GitHub:
https://github.com/SANTHOSH-KUMAR-cell

LinkedIn:
(Add your LinkedIn profile)

---

## ⭐ Support

If you found this project helpful, please consider giving it a ⭐ on GitHub.

---

## 📜 License

This project is developed for educational and learning purposes.
