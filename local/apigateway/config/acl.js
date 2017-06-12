/**
 * @file 
 * User-specified IP-based whitelist/blacklist
 Sample:
 {
    "allowed": [
        // allow all
    ],
    "denied": [
        "3.3.3.3/16" // deny some
    ]
}

{
    "allowed": [
        "2.2.2.0/24" // allow specific subnet
    ],
    "denied": [
        "3.3.3.3/16" // deny some
    ]
}

 */
exports.acl = {
    "allowed": [
        "0.0.0.0/0",
        "2.2.2.2/32",
        "10.214.44.79/32"
    ],
    "denied": [
        "3.3.3.3/16",
        "10.214.44.78/32"
    ]
};