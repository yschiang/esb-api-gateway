<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:dp="http://www.datapower.com/extensions" 
	extension-element-prefixes="dp" exclude-result-prefixes="dp">

  <!-- Used by AAA Action post-process to claim the AAA is completed and the 
       user is permitted to execute the mgmt rest API -->
  <xsl:output method="text" />
  <xsl:template match="/">

    <xsl:variable name="ident" select="//identity/entry/username/text()"/>
    <dp:set-variable name="'var://context/mgmtMgr/aaa'" value="'approved'"/>
    <dp:set-variable name="'var://context/mgmtMgr/clientCredential'" value="string($ident)"/>
  </xsl:template>

</xsl:stylesheet>