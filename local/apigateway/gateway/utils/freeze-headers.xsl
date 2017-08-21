<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:dp="http://www.datapower.com/extensions" 
	extension-element-prefixes="dp" exclude-result-prefixes="dp">

  <xsl:template match="/">
    <xsl:message dp:priority="critic">aaaaa</xsl:message>
    <dp:freeze-headers/>
  </xsl:template>

</xsl:stylesheet>