# How to Change DNS Settings on Windows

To fix the MongoDB Atlas DNS resolution issue, you may need to change your DNS settings. Here's how:

## Method 1: Using Windows Settings (Windows 10/11)

1. Open Settings (Windows key + I)
2. Click on "Network & Internet"
3. Click on "Ethernet" or "Wi-Fi" (depending on your connection)
4. Click on your active connection
5. Click on "Edit" next to "DNS server assignment"
6. Select "Manual" 
7. Turn on "IPv4"
8. In the "Preferred DNS" field, enter: `8.8.8.8`
9. In the "Alternate DNS" field, enter: `8.8.4.4`
10. Click "Save"
11. Restart your computer

## Method 2: Using Control Panel

1. Open Control Panel
2. Click on "Network and Internet"
3. Click on "Network and Sharing Center"
4. Click on "Change adapter settings"
5. Right-click on your active network connection
6. Select "Properties"
7. Select "Internet Protocol Version 4 (TCP/IPv4)"
8. Click "Properties"
9. Select "Use the following DNS server addresses"
10. In "Preferred DNS server", enter: `8.8.8.8`
11. In "Alternate DNS server", enter: `8.8.4.4`
12. Click "OK" to save
13. Restart your computer

## Test DNS Change

After changing your DNS settings, test the connection:

```cmd
nslookup cluster0.uz69bui.mongodb.net
```

You should see output similar to:
```
Non-authoritative answer:
Name:    cluster0.uz69bui.mongodb.net
Addresses:  3.3.3.3
          4.4.4.4
          5.5.5.5
```

## Revert DNS Settings

To revert to automatic DNS settings:

1. Follow steps 1-5 from Method 1 or 1-7 from Method 2
2. Select "Automatic (DHCP)" instead of "Manual"
3. Save and restart your computer