package com.banking.Bank.repository;

import com.banking.Bank.entity.Accounts;
import org.springframework.data.jpa.repository.JpaRepository;

public interface Accountrepository extends JpaRepository<Accounts,Long> {
}
