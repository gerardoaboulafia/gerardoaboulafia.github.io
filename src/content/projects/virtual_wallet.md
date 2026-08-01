---
title: "NoSQL Virtual Wallet"
year: 2026
stack: ["Python", "MongoDB", "Redis", "PyMongo", "OpenAI API"]
summary: "A virtual wallet backed by MongoDB and Redis, with multi-document ACID money transfers, cache-aside balances, and financial aggregation reports."
repo: "https://github.com/gerardoaboulafia/tp-nosql-virtualwallet"
featured: true
order: 2
---
This project implements a virtual wallet on a document database, built for the NoSQL / document databases course at Universidad Católica Argentina as a four-person team project. MongoDB, running as a replica set, is the source of truth, while Redis provides a cache-aside layer for account balances and a sorted-set ranking of transaction volume. The core of the system is the money-transfer operation, which performs the debit, the credit, and an immutable transaction record inside a single multi-document transaction — guaranteeing full **ACID** semantics: atomic all-or-nothing writes, balance and limit re-validation *inside* the transaction to close the TOCTOU gap, snapshot isolation, majority write concern with journaling for durability, and idempotency enforced by a unique sparse index on the external reference.

Beyond transfers, the project models users, accounts, transactions, and spending categories with embedded subdocuments, and ships five financial aggregation pipelines (spending by category, average ticket per user, top accounts by volume via `$facet`, daily cash-flow series, and transaction success rate). Indexes follow the **ESR** (Equality, Sort, Range) rule for the main access patterns, and a lightweight web console — built with the Python standard library alone — exposes every demo, pipeline, and inspection tool with a single click. An optional feature uses the OpenAI API to translate natural-language questions into live MongoDB queries.
