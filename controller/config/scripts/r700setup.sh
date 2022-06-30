#!/bin/bash

#
# Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause
#
echo 'Welcome to the Impinj R700 initial configuration script.'
echo 'This script requires sshpass and openssl to execute the'
echo 'necessary commands.  When executed, this script will...'
echo '    1. Enable the HTTPS network functionality'
echo '    2. Enable the RESTful command interface'
echo '    3. Change the root user password from its default'
echo '    4. Reboot the Impinj R700'
echo '    5. Calculate the Basic Authorization header value'
echo

# Install necessary packages
sudo apt install -qq sshpass openssl
echo

# R700 username
USERNAME=root

# Default R700 password
OLD_PASSWORD=impinj

# Prompt for new password
echo 'Please enter a new root user password...'
read NEW_PASSWORD
#NEW_PASSWORD=impinj
echo

# Prompt for IP Addresses
echo 'Please enter the IP Address of your Impinj R700...'
read IP_ADDRESS
#IP_ADDRESS=192.168.1.34
echo

# Enable the https interface
echo 'Enabling HTTPS...'
sshpass -p$OLD_PASSWORD ssh root@$IP_ADDRESS config network https enable

# Enable the RESTful interface
echo 'Enabling RESTful command interface...'
sshpass -p$OLD_PASSWORD ssh root@$IP_ADDRESS config rfid interface rest

# Update the password
echo 'Updating the root user password...'
sshpass -p$OLD_PASSWORD ssh root@$IP_ADDRESS config access mypasswd $OLD_PASSWORD $NEW_PASSWORD

# Reboot the reader
echo 'Rebooting the Impinj R700...'
sshpass -p$NEW_PASSWORD ssh root@$IP_ADDRESS reboot

# Calculate the Auth String for https BASIC Authentication header
IMPINJ_BASIC_AUTH=$(echo -n $USERNAME:$NEW_PASSWORD | openssl enc -base64)
echo
echo 'Your Basic Authorization header value is:  Basic '$IMPINJ_BASIC_AUTH
echo
echo 'Please be sure to add the following variable to your .env file...'
echo 'IMPINJ_BASIC_AUTH='$IMPINJ_BASIC_AUTH
echo

# Create a self signed certificate for the backend API
echo
echo 'Create a self signed certificate for the backend API using openssl...'
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
