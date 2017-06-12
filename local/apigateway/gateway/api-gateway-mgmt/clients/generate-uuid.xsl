<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:dp="http://www.datapower.com/extensions" 
	extension-element-prefixes="dp" exclude-result-prefixes="dp">

    <xsl:template match="/">
        <uuid><xsl:value-of select="dp:generate-uuid()"/></uuid>
    </xsl:template>
</xsl:stylesheet>